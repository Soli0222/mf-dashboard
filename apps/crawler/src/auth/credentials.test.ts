import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock otpauth with proper class mock
vi.mock("otpauth", () => {
  return {
    TOTP: class {
      generate() {
        return "123456";
      }
    },
  };
});

import { getCredentials, getOTP } from "./credentials.js";

describe("credentials", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      MF_USERNAME: "test-user@example.com",
      MF_PASSWORD: "test-password",
      MF_TOTP_SECRET: "TESTSECRET",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getCredentials", () => {
    test("returns credentials from environment variables", () => {
      const result = getCredentials();

      expect(result).toEqual({
        username: "test-user@example.com",
        password: "test-password",
      });
    });

    test("throws error when MF_USERNAME is not set", () => {
      delete process.env.MF_USERNAME;

      expect(() => getCredentials()).toThrow("MF_USERNAME and MF_PASSWORD are required");
    });

    test("throws error when MF_PASSWORD is not set", () => {
      delete process.env.MF_PASSWORD;

      expect(() => getCredentials()).toThrow("MF_USERNAME and MF_PASSWORD are required");
    });
  });

  describe("getOTP", () => {
    test("returns generated TOTP", () => {
      const result = getOTP();

      expect(result).toBe("123456");
    });

    test("throws error when MF_TOTP_SECRET is not set", () => {
      delete process.env.MF_TOTP_SECRET;

      expect(() => getOTP()).toThrow("MF_TOTP_SECRET is required");
    });
  });
});
