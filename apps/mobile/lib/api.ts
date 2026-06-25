export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Carries the HTTP status so callers/retry logic can branch on it. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 2;

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const caller = init.signal;
  if (caller) {
    if (caller.aborted) controller.abort();
    else caller.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// iOS New Arch (Hermes) intermittently fails to read a fetch body with
// "Unable to resolve data for blob: <uuid>" under concurrency. The request
// succeeded; only the JS-side read lost a race. Retry the whole request.
function isBlobReadError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? "";
  return /resolve data for blob/i.test(msg);
}

async function fetchAndParse<T>(
  url: string,
  init: RequestInit,
  retries: number,
  timeoutMs: number
): Promise<T> {
  let lastErr: Error = new NetworkError("Network request failed after retries");
  for (let attempt = 0; attempt <= retries; attempt++) {
    const backoff = () => new Promise((r) => setTimeout(r, 500 * (attempt + 1)));

    let res: Response;
    try {
      res = await fetchWithTimeout(url, init, timeoutMs);
    } catch (err) {
      lastErr = new NetworkError(`Network request failed: ${(err as Error).message}`);
      if (attempt < retries) {
        await backoff();
        continue;
      }
      throw lastErr;
    }

    if (res.status >= 502 && res.status <= 504 && attempt < retries) {
      await backoff();
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ApiError(res.status, `API ${res.status} ${url}: ${body.slice(0, 200)}`);
    }

    // 204 / empty body: return undefined as T.
    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    try {
      return (await res.json()) as T;
    } catch (err) {
      if (isBlobReadError(err) && attempt < retries) {
        lastErr = new NetworkError(`Response read failed: ${(err as Error).message}`);
        await backoff();
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/** Maps any caught error to a short, user-safe message. Never leaks internals. */
export function friendlyError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403)
      return "Your session expired. Sign in and try again.";
    if (err.status === 404) return "We couldn't find that. Please try again.";
    if (err.status === 429) return "Too many requests. Give it a moment and try again.";
    if (err.status >= 500) return "Our servers had a hiccup. Please try again shortly.";
    return fallback;
  }
  if (err instanceof NetworkError)
    return "Connection problem. Check your internet and try again.";
  return fallback;
}

/** Authenticated fetch against the Meridian API. Token is the Meridian session JWT. */
export async function apiFetch<T = unknown>(
  path: string,
  token: string,
  options?: ApiFetchOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { timeoutMs, retries, headers, ...rest } = options ?? {};
  return fetchAndParse<T>(
    url,
    {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    },
    retries ?? DEFAULT_RETRIES,
    timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
}
