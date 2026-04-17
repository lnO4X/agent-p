/**
 * Structured JSON logger for production observability.
 *
 * Output format: JSON-per-line (compatible with Vercel Log Drains, Datadog, Axiom).
 * Avoid console.log/error directly in production code — use this logger.
 *
 * Usage:
 *   logger.info("auth.login", "User logged in", { userId: "..." })
 *   logger.warn("redis", "Connection slow", { latencyMs: 500 })
 *   logger.error("billing.checkout", "Creem API failed", err, { orderId: "..." })
 */

interface LogFields {
  [key: string]: unknown;
}

function serialize(
  level: "info" | "warn" | "error",
  mod: string,
  msg: string,
  fields: LogFields
): string {
  return JSON.stringify({
    level,
    mod,
    msg,
    ...fields,
    ts: Date.now(),
  });
}

function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    };
  }
  return { error: String(err) };
}

export const logger = {
  info(mod: string, msg: string, fields: LogFields = {}): void {
    console.info(serialize("info", mod, msg, fields));
  },
  warn(mod: string, msg: string, fields: LogFields = {}): void {
    console.warn(serialize("warn", mod, msg, fields));
  },
  error(
    mod: string,
    msg: string,
    err?: unknown,
    fields: LogFields = {}
  ): void {
    const errFields = err !== undefined ? serializeError(err) : {};
    console.error(serialize("error", mod, msg, { ...errFields, ...fields }));
  },
};
