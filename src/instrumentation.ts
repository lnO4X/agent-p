/**
 * Next.js instrumentation — runs once when the server starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only validate env on the server (not during build or edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env-check");
    validateEnv();
  }
}
