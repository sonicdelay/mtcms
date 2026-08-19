import type { Response } from "express";

/**
 * Sends an RFC 7807 (Problem Details) error response.
 */
export function problem(
  res: Response,
  status: number,
  title: string,
  detail?: string,
): void {
  res.status(status).type("application/problem+json").json({
    type: "about:blank",
    title,
    status,
    detail: detail ?? title,
  });
}
