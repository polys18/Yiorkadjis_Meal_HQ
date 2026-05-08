import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, isValidPinFormat } from "./pin";

describe("PIN helpers", () => {
  it("hashes and verifies a 4-digit PIN", async () => {
    const hash = await hashPin("1234");
    expect(hash).not.toBe("1234");
    expect(await verifyPin("1234", hash)).toBe(true);
    expect(await verifyPin("0000", hash)).toBe(false);
  });

  it("validates PIN format", () => {
    expect(isValidPinFormat("1234")).toBe(true);
    expect(isValidPinFormat("0000")).toBe(true);
    expect(isValidPinFormat("12")).toBe(false);
    expect(isValidPinFormat("12345")).toBe(false);
    expect(isValidPinFormat("12a4")).toBe(false);
    expect(isValidPinFormat("")).toBe(false);
  });
});
