import { describe, it, expect } from "vitest";
import {
  isHTMLElement,
  isHTMLButtonElement,
  isValidCapitalOneUrl,
} from "../typeGuards";

describe("typeGuards", () => {
  describe("isHTMLElement", () => {
    it("returns true for HTMLElement", () => {
      const div = document.createElement("div");
      expect(isHTMLElement(div)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isHTMLElement(null)).toBe(false);
    });
  });

  describe("isHTMLButtonElement", () => {
    it("returns true for HTMLButtonElement", () => {
      const button = document.createElement("button");
      expect(isHTMLButtonElement(button)).toBe(true);
    });

    it("returns false for non-button element", () => {
      const div = document.createElement("div");
      expect(isHTMLButtonElement(div)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isHTMLButtonElement(null)).toBe(false);
    });
  });

  describe("isValidCapitalOneUrl - Issue #2 Security Tests", () => {
    it("returns true for valid c1-offers URL", () => {
      expect(
        isValidCapitalOneUrl("https://capitaloneoffers.com/c1-offers")
      ).toBe(true);
    });

    it("returns true for valid feed URL", () => {
      expect(isValidCapitalOneUrl("https://capitaloneoffers.com/feed")).toBe(
        true
      );
    });

    it("returns true for valid URLs with paths", () => {
      expect(
        isValidCapitalOneUrl("https://capitaloneoffers.com/c1-offers/some-path")
      ).toBe(true);
      expect(
        isValidCapitalOneUrl("https://capitaloneoffers.com/feed?param=value")
      ).toBe(true);
    });

    it("returns false for invalid URLs", () => {
      expect(isValidCapitalOneUrl("https://example.com")).toBe(false);
      expect(isValidCapitalOneUrl("https://google.com")).toBe(false);
      expect(isValidCapitalOneUrl("https://capitaloneoffers.com/other")).toBe(
        false
      );
    });

    it("returns false for undefined", () => {
      expect(isValidCapitalOneUrl(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidCapitalOneUrl("")).toBe(false);
    });

    it("handles protocol variations correctly", () => {
      expect(isValidCapitalOneUrl("http://capitaloneoffers.com/feed")).toBe(
        false
      );
      expect(isValidCapitalOneUrl("ftp://capitaloneoffers.com/feed")).toBe(
        false
      );
    });

    it("is case-sensitive for security", () => {
      expect(
        isValidCapitalOneUrl("https://capitaloneoffers.com/C1-OFFERS")
      ).toBe(false);
    });

    it("prevents subdomain spoofing", () => {
      expect(
        isValidCapitalOneUrl("https://malicious.capitaloneoffers.com/feed")
      ).toBe(false);
      expect(
        isValidCapitalOneUrl("https://capitaloneoffers.com.evil.com/feed")
      ).toBe(false);
    });
  });
});
