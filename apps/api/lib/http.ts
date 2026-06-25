import { NextResponse } from "next/server";
import { requireUser, AuthError, type AuthedUser } from "./auth/user";

/** JSON response helper. */
export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data as object, { status });
}

export function errorJson(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap a route handler with auth + uniform error handling. The handler receives
 * the verified user. AuthError maps to its status; anything else is a 500 with
 * no internal details leaked.
 */
export function withAuth(
  handler: (req: Request, user: AuthedUser) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    let user: AuthedUser;
    try {
      user = await requireUser(req);
    } catch (err) {
      if (err instanceof AuthError) return errorJson(err.status, err.message);
      return errorJson(401, "Unauthorized");
    }
    try {
      return await handler(req, user);
    } catch (err) {
      if (err instanceof AuthError) return errorJson(err.status, err.message);
      if (err instanceof HttpError) return errorJson(err.status, err.message);
      console.error("Unhandled route error:", err);
      return errorJson(500, "Internal error");
    }
  };
}

/** Throw from inside a handler to return a specific status (e.g. 400 validation). */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Parse a JSON body, throwing HttpError(400) on malformed input. */
export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
