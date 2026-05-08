import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "./session";

beforeAll(() => {
  process.env.COOKIE_SECRET = "test-cookie-secret-32-bytes-long-aa";
});

describe("session cookie", () => {
  it("round-trips a userId through sign/verify", () => {
    const token = signSession("user-abc");
    expect(verifySession(token)).toBe("user-abc");
  });

  it("rejects a token with tampered payload", () => {
    const token = signSession("user-abc");
    const [, sig] = token.split(".");
    const tampered = `user-xyz.${sig}`;
    expect(verifySession(tampered)).toBeNull();
  });

  it("rejects a token with bad signature", () => {
    expect(verifySession("user-abc.notarealhmac")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifySession("")).toBeNull();
    expect(verifySession("nodelimiter")).toBeNull();
    expect(verifySession("a.b.c")).toBeNull();
  });
});
