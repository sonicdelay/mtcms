import type { NextFunction, Request, Response } from "express";
import { problem } from "./http.ts";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function hmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * Issues a signed HS256 JWT for the given user.
 */
export async function signToken(
  user: AuthUser,
  expiresInSeconds = 60 * 60 * 24,
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    user,
    exp: now + expiresInSeconds,
    iat: now,
    iss: "mtcms",
    aud: "mtcms",
  };

  const signingInput = [
    base64UrlEncode(encoder.encode(JSON.stringify(header))),
    base64UrlEncode(encoder.encode(JSON.stringify(payload))),
  ].join(".");

  const key = await hmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Verifies a signed HS256 JWT and returns its user, or null when invalid.
 */
async function verifyToken(token: string): Promise<AuthUser | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(decoder.decode(base64UrlDecode(headerPart)));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") {
    return null;
  }

  const key = await hmacKey(secret, ["verify"]);
  const signatureValid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart),
    encoder.encode(`${headerPart}.${payloadPart}`),
  );
  if (!signatureValid) {
    return null;
  }

  let payload: { exp?: number; user?: AuthUser };
  try {
    payload = JSON.parse(decoder.decode(base64UrlDecode(payloadPart)));
  } catch {
    return null;
  }

  if (
    typeof payload.exp !== "number" ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  if (!payload.user || typeof payload.user !== "object") {
    return null;
  }

  return payload.user;
}

/**
 * Express middleware that guards a router against unauthenticated requests.
 * Sets `req.user` on success.
 */
export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.get("authorization");
  let token: string | null = null;
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.slice(7).trim();
  } else if (
    req.method === "GET" &&
    typeof req.query.token === "string" &&
    req.query.token.trim()
  ) {
    // Anchor links (e.g. "Open raw" media downloads) cannot send headers,
    // so read-only GET requests may authenticate via a query token.
    token = req.query.token.trim();
  }

  if (!token) {
    problem(
      res,
      401,
      "Unauthorized",
      "Authentication credentials were missing or incorrect.",
    );
    return;
  }

  const user = await verifyToken(token);
  if (!user) {
    problem(
      res,
      401,
      "Unauthorized",
      "Authentication credentials were missing or incorrect.",
    );
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
}
