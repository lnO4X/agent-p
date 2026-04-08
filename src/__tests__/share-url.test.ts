import { describe, it, expect } from "vitest";
import { parseScores, parseTalentScores } from "@/lib/quiz-utils";

describe("parseScores", () => {
  it("parses valid 3-part score string", () => {
    expect(parseScores("78-45-62")).toEqual([78, 45, 62]);
  });

  it("parses zeros", () => {
    expect(parseScores("0-0-0")).toEqual([0, 0, 0]);
  });

  it("parses decimal-like numbers (parsed as integers by Number())", () => {
    // "78.5-45.2-62.8" → [78.5, 45.2, 62.8] (Number() handles decimals)
    expect(parseScores("78.5-45.2-62.8")).toEqual([78.5, 45.2, 62.8]);
  });

  it("returns null for null input", () => {
    expect(parseScores(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseScores("")).toBeNull();
  });

  it("returns null for invalid (non-numeric) input", () => {
    expect(parseScores("abc-def-ghi")).toBeNull();
  });

  it("parses 2-part scores", () => {
    expect(parseScores("78-45")).toEqual([78, 45]);
  });

  it("parses 4-part scores", () => {
    expect(parseScores("78-45-62-99")).toEqual([78, 45, 62, 99]);
  });

  it("parses 7-part standard tier scores", () => {
    expect(parseScores("78-45-62-80-55-70-65")).toEqual([78, 45, 62, 80, 55, 70, 65]);
  });

  it("parses 17-part pro tier scores", () => {
    const s = "78-45-62-80-55-70-65-90-42-68-73-81-59-77-66-83-71";
    const result = parseScores(s);
    expect(result).toHaveLength(17);
    expect(result![0]).toBe(78);
    expect(result![16]).toBe(71);
  });

  it("returns null for partially invalid input", () => {
    expect(parseScores("78-abc-62")).toBeNull();
  });

  it("handles single dash", () => {
    expect(parseScores("-")).toBeNull();
  });

  it("parses 100-100-100", () => {
    expect(parseScores("100-100-100")).toEqual([100, 100, 100]);
  });
});

describe("parseTalentScores", () => {
  it("parses valid talent score string", () => {
    const result = parseTalentScores("reaction_speed:75,memory:60");
    expect(result).toEqual({
      reaction_speed: 75,
      memory: 60,
    });
  });

  it("parses single talent", () => {
    const result = parseTalentScores("strategy_logic:88");
    expect(result).toEqual({ strategy_logic: 88 });
  });

  it("returns null for null input", () => {
    expect(parseTalentScores(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseTalentScores("")).toBeNull();
  });

  it("returns null for completely invalid input (no colons)", () => {
    expect(parseTalentScores("invalid")).toBeNull();
  });

  it("returns null for string with only commas", () => {
    expect(parseTalentScores(",,,")).toBeNull();
  });

  it("skips pairs with non-numeric values", () => {
    const result = parseTalentScores("reaction_speed:abc,memory:60");
    expect(result).toEqual({ memory: 60 });
  });

  it("returns null when all pairs are invalid", () => {
    expect(parseTalentScores("a:b,c:d")).toBeNull();
  });

  it("handles decimal scores", () => {
    const result = parseTalentScores("reaction_speed:75.5");
    expect(result).toEqual({ reaction_speed: 75.5 });
  });

  it("parses many talent categories", () => {
    const input =
      "reaction_speed:80,hand_eye_coord:70,spatial_awareness:65,memory:60,strategy_logic:55";
    const result = parseTalentScores(input);
    expect(result).toEqual({
      reaction_speed: 80,
      hand_eye_coord: 70,
      spatial_awareness: 65,
      memory: 60,
      strategy_logic: 55,
    });
  });

  it("handles zero scores", () => {
    const result = parseTalentScores("reaction_speed:0");
    expect(result).toEqual({ reaction_speed: 0 });
  });

  it("skips empty pairs from trailing comma", () => {
    const result = parseTalentScores("reaction_speed:75,");
    expect(result).toEqual({ reaction_speed: 75 });
  });
});
