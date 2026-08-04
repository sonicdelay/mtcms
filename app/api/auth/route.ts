import { NextResponse } from "next/server";
import { signToken, getAuthUser, type AuthUser } from "@/lib/auth";
import { problemResponse } from "@/lib/http";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  let email: string | undefined;
  let password: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    email = form.get("email")?.toString();
    password = form.get("password")?.toString();
  } else {
    try {
      const body = await request.json();
      email = body?.email;
      password = body?.password;
    } catch {
      return problemResponse(400, "Bad Request", "Request body must be valid JSON.");
    }
  }

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return problemResponse(400, "Bad Request", "email and password are required.");
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return problemResponse(
      500,
      "Internal Server Error",
      "Authentication is not configured on the server.",
    );
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return problemResponse(401, "Unauthorized", "Invalid email or password.");
  }

  try {
    const user: AuthUser = {
      id: "00000000-0000-4000-8000-000000000000",
      email: ADMIN_EMAIL,
      role: "Admin",
    };
    const token = await signToken(user);
    return NextResponse.json({ token, user });
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return problemResponse(
      401,
      "Unauthorized",
      "Authentication credentials were missing or incorrect.",
    );
  }

  try {
    const token = await signToken(user);
    return NextResponse.json({ token, user });
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
