import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { problemResponse } from "@/lib/http";
import { AuthError, login, refresh } from "@/lib/auth.service";

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
      return problemResponse(
        400,
        "Bad Request",
        "Request body must be valid JSON.",
      );
    }
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return problemResponse(
      400,
      "Bad Request",
      "email and password are required.",
    );
  }

  try {
    return NextResponse.json(await login(email, password));
  } catch (error) {
    if (error instanceof AuthError) {
      return problemResponse(401, "Unauthorized", "Invalid email or password.");
    }
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
    return NextResponse.json(await refresh(user));
  } catch (error) {
    return problemResponse(
      500,
      "Internal Server Error",
      (error as Error).message,
    );
  }
}
