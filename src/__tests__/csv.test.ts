import { describe, it, expect } from "vitest";
import { escapeCsv, toCsv } from "@/lib/csv";

describe("escapeCsv", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsv(null)).toBe("");
    expect(escapeCsv(undefined)).toBe("");
  });

  it("coerces numbers and booleans", () => {
    expect(escapeCsv(42)).toBe("42");
    expect(escapeCsv(true)).toBe("true");
    expect(escapeCsv(0)).toBe("0");
  });

  it("leaves simple strings untouched", () => {
    expect(escapeCsv("hello")).toBe("hello");
    expect(escapeCsv("a-b.c/d")).toBe("a-b.c/d");
  });

  it("quotes fields containing commas", () => {
    expect(escapeCsv("a, b")).toBe('"a, b"');
  });

  it("quotes fields containing newlines", () => {
    expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsv("line1\rline2")).toBe('"line1\rline2"');
  });

  it("escapes embedded double quotes by doubling them", () => {
    expect(escapeCsv('she said "hi"')).toBe('"she said ""hi"""');
  });
});

describe("toCsv", () => {
  it("returns only the header row when rows is empty", () => {
    const csv = toCsv(["id", "name"], []);
    expect(csv).toBe("id,name");
  });

  it("emits one line per row with values in header order", () => {
    const csv = toCsv(
      ["id", "name", "score"],
      [
        { id: "1", name: "Alice", score: 95 },
        { id: "2", name: "Bob", score: 88 },
      ]
    );
    expect(csv).toBe("id,name,score\n1,Alice,95\n2,Bob,88");
  });

  it("fills missing keys with empty strings", () => {
    const csv = toCsv(
      ["id", "name", "score"],
      [{ id: "1", name: "Alice" }]
    );
    expect(csv).toBe("id,name,score\n1,Alice,");
  });

  it("escapes commas and quotes in field values", () => {
    const csv = toCsv(
      ["name", "note"],
      [{ name: "Alice, Jr.", note: 'says "hi"' }]
    );
    expect(csv).toBe(`name,note\n"Alice, Jr.","says ""hi"""`);
  });
});
