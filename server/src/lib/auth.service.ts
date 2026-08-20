import bcrypt from "bcryptjs";
import { type AuthUser, signToken } from "./auth.ts";
import { getUserByEmail } from "./nodes.service.ts";

export class AuthError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "AuthError";
  }
}

interface UserNodeData {
  "0"?: {
    values?: {
      en?: { email?: string; role?: string; password?: string };
    };
  };
}

/**
 * Authenticates a user against a user node stored in the database.
 * Throws AuthError on failure.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthUser> {
  const node = await getUserByEmail(email);
  if (!node) {
    throw new AuthError("Invalid email or password");
  }

  const values = (node.data as UserNodeData | null)?.["0"]?.values?.en;
  if (!values?.email || !values.password) {
    throw new AuthError("Invalid email or password");
  }

  if (!bcrypt.compareSync(password, values.password)) {
    throw new AuthError("Invalid email or password");
  }

  return {
    id: node.id,
    email: values.email,
    role: values.role ?? "User",
  };
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