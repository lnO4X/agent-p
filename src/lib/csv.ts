/**
 * Tiny CSV encoder. Keeps dependencies at zero — we do not want papaparse
 * just to serialise a handful of columns.
 *
 * RFC 4180 rules implemented:
 *   - Fields containing `,`, `"`, `\n`, or `\r` are wrapped in double quotes.
 *   - Embedded `"` is escaped as `""`.
 *   - null / undefined become empty strings.
 *   - Non-string scalars are coerced via String().
 */

export function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serialize an array of rows to a CSV string.
 *
 * Rows may have missing keys — the output always has every column with an empty
 * field for missing values (headers are the source of truth for column order).
 *
 * Returns only the header row when `rows` is empty.
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly Record<string, unknown>[]
): string {
  const lines: string[] = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}
