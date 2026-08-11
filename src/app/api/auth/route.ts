import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

type NodeRow = {
  id: string;
  data: unknown;
};

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type TokenPayload = {
  user: AuthUser;
};

const JWT_SECRET = process.env.JWTSECRET ?? "1f5e6a1ccd833d0e6a82a832a5c08671";
const JWT_ISSUER = "https://www.sonicdelay.net";
const JWT_AUDIENCE = "mtcms";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
};

const extractAuthUser = (row: NodeRow): (AuthUser & { passwordHash: string }) | null => {
  const data = asRecord(row.data);
  const item0 = asRecord(data?.["0"]);
  const values = asRecord(item0?.values);
  const en = asRecord(values?.en);

  const email = typeof en?.email === "string" ? en.email : "";
  const passwordHash = typeof en?.password === "string" ? en.password : "";
  const role = typeof en?.role === "string" ? en.role : "user";

  if (!email || !passwordHash) {
    return null;
  }

  return {
    id: row.id,
    email,
    role,
    passwordHash,
  };
};

const extractUserIdFromPayload = (payload: unknown): string | null => {
  const body = asRecord(payload);
  const user = asRecord(body?.user);
  return typeof user?.id === "string" ? user.id : null;
};

const invalidTokenResponse = () =>
  NextResponse.json({ error: "Invalid token" }, { status: 401 });

const invalidCredentialsResponse = () =>
  NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

const getUserByEmail = async (email: string) => {
  const {
    rows: [row],
  } = await pool.query<NodeRow>(
    `SELECT id, data FROM nodes WHERE type = 'user' AND LOWER(data->'0'->'values'->'en'->>'email') = LOWER($1) LIMIT 1`,
    [email],
  );

  return row ? extractAuthUser(row) : null;
};

const getUserById = async (id: string) => {
  const {
    rows: [row],
  } = await pool.query<NodeRow>(
    `SELECT id, data FROM nodes WHERE id = $1 LIMIT 1`,
    [id],
  );

  return row ? extractAuthUser(row) : null;
};

const getBearerToken = (request: Request): string => {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
};

const signToken = async (user: AuthUser): Promise<string> => {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("2h")
    .sign(SECRET_BYTES);
};

const readCredentials = async (
  request: Request,
): Promise<{ email: string; password: string } | null> => {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    let body: Record<string, unknown> | null = null;

    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      body = null;
    }

    if (!body) return null;

    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    return { email, password };
  }

  const form = await request.formData().catch(() => null);
  if (!form) return null;

  const email = form.get("email");
  const password = form.get("password");

  return {
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  };
};

export async function POST(request: Request) {
  const credentials = await readCredentials(request);
  const email = credentials?.email?.trim() ?? "";
  const password = credentials?.password ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return invalidCredentialsResponse();
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return invalidCredentialsResponse();
  }

  const token = await signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({ token });
}

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return invalidTokenResponse();
  }

  const verifyResult = await jwtVerify(token, SECRET_BYTES, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }).catch(() => null);

  if (!verifyResult) {
    return invalidTokenResponse();
  }

  const payload = verifyResult.payload as unknown as TokenPayload;
  const userId = extractUserIdFromPayload(payload);

  if (!userId) {
    return invalidTokenResponse();
  }

  const user = await getUserById(userId);
  if (!user) {
    return invalidCredentialsResponse();
  }

  const refreshedToken = await signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({ token: refreshedToken });
}
