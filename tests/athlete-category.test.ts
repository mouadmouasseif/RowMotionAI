import { describe, expect, it } from "vitest";
import { getAthleteCategory } from "@/lib/athlete-category";

describe("athlete category", () => {
  it.each([
    [2012, "U15"], [2009, "U19"], [2007, "U21"], [2005, "U23"], [2000, "SENIOR"],
  ] as const)("classifies birth year %s", (birthYear, expected) => {
    expect(getAthleteCategory(new Date(Date.UTC(birthYear, 0, 1)), 2026)).toBe(expected);
  });
});
