import { describe, it, expect } from "vitest";
import { parseMileageValue } from "../mileageParser";

describe("parseMileageValue", () => {
  describe("multiplier format", () => {
    it("parses 2X miles correctly", () => {
      expect(parseMileageValue("2X miles")).toBe(2000);
    });

    it("parses 5X miles correctly", () => {
      expect(parseMileageValue("5X miles")).toBe(5000);
    });

    it("handles case insensitivity", () => {
      expect(parseMileageValue("3x MILES")).toBe(3000);
    });
  });

  describe("numeric format", () => {
    it("parses standard miles with comma", () => {
      expect(parseMileageValue("Up to 60,000 miles")).toBe(60000);
    });

    it("parses miles without 'Up to' prefix", () => {
      expect(parseMileageValue("5,000 miles")).toBe(5000);
    });

    it("parses miles without commas", () => {
      expect(parseMileageValue("10000 miles")).toBe(10000);
    });

    it("handles multiple commas", () => {
      expect(parseMileageValue("1,000,000 miles")).toBe(1000000);
    });

    it("handles case insensitivity", () => {
      expect(parseMileageValue("up to 50,000 MILES")).toBe(50000);
    });
  });

  describe("asterisk handling", () => {
    it("removes asterisks from text", () => {
      expect(parseMileageValue("*2X miles*")).toBe(2000);
    });

    it("removes multiple asterisks", () => {
      expect(parseMileageValue("***Up to 50,000 miles***")).toBe(50000);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for invalid format", () => {
      expect(parseMileageValue("invalid text")).toBe(0);
    });

    it("returns 0 for empty string", () => {
      expect(parseMileageValue("")).toBe(0);
    });

    it("returns 0 for text without miles keyword", () => {
      expect(parseMileageValue("5000 points")).toBe(0);
    });

    it("handles whitespace correctly", () => {
      expect(parseMileageValue("  2X miles  ")).toBe(2000);
    });
  });
});
