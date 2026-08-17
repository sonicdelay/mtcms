import { NextResponse } from "next/server";

/**
 * Returns an RFC 7807 (Problem Details) error response.
 */
export function problemResponse(
  status: number,
  title: string,
  detail?: string,
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      type: "about:blank",
      title,
      status,
      detail: detail ?? title,
    }),
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    },
  );
}
