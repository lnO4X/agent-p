import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for API route testing.
 */
export function createRequest(
  method: string,
  url: string = "http://localhost:3000/api/test",
  options: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...options.headers,
    },
  };

  if (options.body && method !== "GET") {
    init.body = JSON.stringify(options.body);
  }

  const request = new NextRequest(new URL(url), init);

  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      request.cookies.set(name, value);
    }
  }

  return request;
}
