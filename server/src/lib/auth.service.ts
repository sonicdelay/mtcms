import { timingSafeEqual } from "node:crypto";
import { type AuthUser, signToken } from "./auth.ts";
import { getUserByEmail } from "./nodes.service.ts";
import type { NodeDataItem } from "./types.ts";

export class AuthError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "AuthError";
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function passwordsMatch(input: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2")) {
    try {
      const bcrypt = await import("bcryptjs");
      return bcrypt.compareSync(input, stored);
    } catch {
      // bcryptjs is not installed; fall back to a constant-time comparison.
    }
  }

  const a = new TextEncoder().encode(input);
  const b = new TextEncoder().encode(stored);
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function userFromNode(node: {
  id: string;
  data: Record<string, unknown> | null;
}): AuthUser | null {
  const data = node.data as
    | {
      "0"?: {
        values?: {
          en?: { email?: string; role?: string; password?: string };
        };
      };
    }
    | null
    | undefined;
  const values = data?.["0"]?.values?.en;
  if (!values?.email) {
    return null;
  }
  return {
    id: node.id,
    email: values.email,
    role: values.role ?? "User",
  };
}

/**
 * Authenticates a user against the configured admin credentials or a user
 * node stored in the database. Throws AuthError on failure.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthUser> {
  if (
    ADMIN_EMAIL &&
    ADMIN_PASSWORD &&
    email === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {
    return {
      id: "00000000-0000-4000-8000-000000000000",
      email: ADMIN_EMAIL,
      role: "Admin",
    };
  }

  const node = await getUserByEmail(email);
  const user = node ? userFromNode(node) : null;
  const storedPassword = node && user
    ? ((
      node.data as unknown as {
        "0": { values?: { en?: NodeDataItem & { password?: string } } };
      }
    )?.["0"]?.values?.en?.password ?? "")
    : "";

  if (
    user &&
    storedPassword &&
    (await passwordsMatch(password, storedPassword))
  ) {
    return user;
  }

  throw new AuthError("Invalid email or password");
}

/**
 * Authenticates and issues a signed token.
 */
export async function login(email: string, password: string) {
  const user = await authenticate(email, password);
  const token = await signToken(user);
  return { token, user };
}

/**
 * Issues a fresh token for an already authenticated user.
 */
export async function refresh(user: AuthUser) {
  const token = await signToken(user);
  return { token, user };
}
