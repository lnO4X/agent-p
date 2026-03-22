import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock instance for SignJWT
const { mockSignJWTInstance, mockCookieStore } = vi.hoisted(() => ({
  mockSignJWTInstance: {
    setProtectedHeader: vi.fn(),
    setIssuedAt: vi.fn(),
    setExpirationTime: vi.fn(),
    sign: vi.fn(),
  },
  mockCookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

// Chain returns
mockSignJWTInstance.setProtectedHeader.mockReturnValue(mockSignJWTInstance);
mockSignJWTInstance.setIssuedAt.mockReturnValue(mockSignJWTInstance);
mockSignJWTInstance.setExpirationTime.mockReturnValue(mockSignJWTInstance);
mockSignJWTInstance.sign.mockResolvedValue("mock-jwt-token");

// Mock jose — SignJWT must be a constructor (used with `new`)
vi.mock("jose", () => {
  function MockSignJWT(this: typeof mockSignJWTInstance, _payload: unknown) {
    Object.assign(this, mockSignJWTInstance);
  }
  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import { SignJWT, jwtVerify } from "jose";
import {
  createToken,
  verifyToken,
  getAuthFromCookie,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  LOGGED_IN_COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-at-least-32-chars-long";

    // Re-setup chain after clearAllMocks
    mockSignJWTInstance.setProtectedHeader.mockReturnValue(mockSignJWTInstance);
    mockSignJWTInstance.setIssuedAt.mockReturnValue(mockSignJWTInstance);
    mockSignJWTInstance.setExpirationTime.mockReturnValue(mockSignJWTInstance);
    mockSignJWTInstance.sign.mockResolvedValue("mock-jwt-token");
  });

  describe("createToken", () => {
    it("returns a string token", async () => {
      const token = await createToken({ sub: "user-1", username: "testuser" });
      expect(token).toBe("mock-jwt-token");
      expect(typeof token).toBe("string");
    });

    it("sets HS256 header and expiration", async () => {
      await createToken({ sub: "user-1", username: "testuser" });
      expect(mockSignJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
      expect(mockSignJWTInstance.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWTInstance.setExpirationTime).toHaveBeenCalledWith("30d");
    });
  });

  describe("verifyToken", () => {
    it("returns payload for valid token", async () => {
      const mockPayload = { sub: "user-1", username: "testuser" };
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        payload: mockPayload,
      });
      const result = await verifyToken("valid-token");
      expect(result).toEqual(mockPayload);
    });

    it("returns null for invalid token", async () => {
      (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("invalid token")
      );
      const result = await verifyToken("invalid-token");
      expect(result).toBeNull();
    });

    it("returns null for expired token", async () => {
      (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("token expired")
      );
      const result = await verifyToken("expired-token");
      expect(result).toBeNull();
    });
  });

  describe("JWT_SECRET requirement", () => {
    it("throws if JWT_SECRET is not set", async () => {
      delete process.env.JWT_SECRET;
      await expect(
        createToken({ sub: "user-1", username: "testuser" })
      ).rejects.toThrow("JWT_SECRET not set");
    });
  });

  describe("getAuthFromCookie", () => {
    it("returns null when no cookie", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);
      const result = await getAuthFromCookie();
      expect(result).toBeNull();
    });

    it("returns null when cookie value is empty", async () => {
      mockCookieStore.get.mockReturnValueOnce({ value: undefined });
      const result = await getAuthFromCookie();
      expect(result).toBeNull();
    });

    it("returns payload when cookie has valid token", async () => {
      const mockPayload = { sub: "user-1", username: "testuser" };
      mockCookieStore.get.mockReturnValueOnce({ value: "some-token" });
      (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        payload: mockPayload,
      });
      const result = await getAuthFromCookie();
      expect(result).toEqual(mockPayload);
    });
  });

  describe("exported constants", () => {
    it("AUTH_COOKIE_NAME is auth-token", () => {
      expect(AUTH_COOKIE_NAME).toBe("auth-token");
    });

    it("AUTH_COOKIE_MAX_AGE is 30 days in seconds", () => {
      expect(AUTH_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 30);
    });

    it("LOGGED_IN_COOKIE_NAME is logged-in", () => {
      expect(LOGGED_IN_COOKIE_NAME).toBe("logged-in");
    });
  });

  describe("setAuthCookie", () => {
    it("sets both auth-token and logged-in cookies", async () => {
      await setAuthCookie("my-token");
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "my-token",
        expect.objectContaining({ httpOnly: true, path: "/" })
      );
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "logged-in",
        "1",
        expect.objectContaining({ httpOnly: false, path: "/" })
      );
    });
  });

  describe("clearAuthCookie", () => {
    it("deletes both cookies", async () => {
      await clearAuthCookie();
      expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("logged-in");
    });
  });
});
