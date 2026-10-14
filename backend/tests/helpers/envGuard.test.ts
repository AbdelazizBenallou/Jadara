import { describe, it, expect, afterEach } from "vitest";
import {
  validateTestDatabaseUrl,
  assertSafeTestEnvironment,
  assertTestDatabaseConfigured,
  maskDatabaseUrl,
  parseDatabaseName,
} from "./envGuard.js";

describe("Database Safety Guard — Unit Tests", () => {
  describe("parseDatabaseName", () => {
    it("extracts database name from a standard postgres URL", () => {
      expect(parseDatabaseName("postgresql://user:pass@localhost:5432/jadara_test")).toBe(
        "jadara_test",
      );
    });

    it("handles query parameters in URL", () => {
      expect(
        parseDatabaseName("postgresql://user:pass@localhost:5432/jadara_test?schema=public"),
      ).toBe("jadara_test");
    });

    it("returns empty string for invalid URLs", () => {
      expect(parseDatabaseName("not-a-url")).toBe("");
    });
  });

  describe("maskDatabaseUrl", () => {
    it("masks username and password while preserving host, port, and database name", () => {
      const masked = maskDatabaseUrl(
        "postgresql://secret_user:super_secret_password@localhost:5432/jadara_test",
      );

      expect(masked).toBe("postgresql://***:***@localhost:5432/jadara_test");
      expect(masked).not.toContain("secret_user");
      expect(masked).not.toContain("super_secret_password");
    });

    it("handles URLs without credentials gracefully", () => {
      expect(maskDatabaseUrl("postgresql://localhost:5432/jadara_test")).toBe(
        "postgresql://localhost:5432/jadara_test",
      );
    });

    it("returns placeholder on malformed URL without throwing", () => {
      expect(maskDatabaseUrl("invalid:url")).toBe("[MALFORMED_URL]");
    });
  });

  describe("validateTestDatabaseUrl", () => {
    it("accepts an authorized local test database URL", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://jadara_user:jadara123@localhost:5432/jadara_test",
        "test",
      );

      expect(result.safe).toBe(true);
      expect(result.dbName).toBe("jadara_test");
      expect(result.reason).toBeUndefined();
    });

    it("accepts a test database ending with _test on 127.0.0.1", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://test_user:pass@127.0.0.1:5432/company_mvp_test",
        "test",
      );

      expect(result.safe).toBe(true);
      expect(result.dbName).toBe("company_mvp_test");
    });

    it("rejects the active development database 'jadara'", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://jadara_user:jadara123@localhost:5432/jadara",
        "test",
      );

      expect(result.safe).toBe(false);
      expect(result.dbName).toBe("jadara");
      expect(result.reason).toContain("active development database");
    });

    it("rejects production hostnames (e.g. sytes.net)", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://jadara_user:pass@jadara.sytes.net:5432/jadara_test",
        "test",
      );

      expect(result.safe).toBe(false);
      expect(result.reason).toContain("production environment");
    });

    it("rejects when NODE_ENV is set to production", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://jadara_user:pass@localhost:5432/jadara_test",
        "production",
      );

      expect(result.safe).toBe(false);
      expect(result.reason).toContain("NODE_ENV is set to 'production'");
    });

    it("rejects non-test database names", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://jadara_user:pass@localhost:5432/other_database",
        "test",
      );

      expect(result.safe).toBe(false);
      expect(result.reason).toContain("must end with '_test'");
    });

    it("rejects empty or missing database URLs", () => {
      expect(validateTestDatabaseUrl("", "test").safe).toBe(false);
      expect(validateTestDatabaseUrl("   ", "test").safe).toBe(false);
    });

    it("rejects syntactically invalid URLs", () => {
      const result = validateTestDatabaseUrl("not-a-valid-url", "test");
      expect(result.safe).toBe(false);
      expect(result.reason).toContain("syntactically invalid");
    });

    it("rejects the unconfigured dummy placeholder URL", () => {
      const result = validateTestDatabaseUrl(
        "postgresql://unconfigured:unconfigured@no-db.test:5432/unconfigured_test",
        "test",
      );
      expect(result.safe).toBe(false);
      expect(result.reason).toContain("unconfigured dummy placeholder");
    });
  });

  describe("assertSafeTestEnvironment", () => {
    it("does not throw when provided a valid test database URL", () => {
      expect(() => {
        assertSafeTestEnvironment({
          databaseUrl: "postgresql://user:pass@localhost:5432/jadara_test",
          nodeEnv: "test",
        });
      }).not.toThrow();
    });

    it("throws a descriptive error when target is the development database", () => {
      expect(() => {
        assertSafeTestEnvironment({
          databaseUrl: "postgresql://user:secret_pass@localhost:5432/jadara",
          nodeEnv: "test",
        });
      }).toThrow(/DATABASE_SAFETY_GUARD.*active development database/);
    });

    it("throws when evaluating the unconfigured dummy URL", () => {
      expect(() => {
        assertSafeTestEnvironment({
          databaseUrl:
            "postgresql://unconfigured:unconfigured@no-db.test:5432/unconfigured_test",
          nodeEnv: "test",
        });
      }).toThrow(/DATABASE_SAFETY_GUARD.*unconfigured dummy placeholder/);
    });

    it("never includes the raw password in the error message", () => {
      try {
        assertSafeTestEnvironment({
          databaseUrl: "postgresql://user:secret_cleartext_pass@localhost:5432/jadara",
          nodeEnv: "test",
        });
        expect.unreachable();
      } catch (err: unknown) {
        const message = (err as Error).message;
        expect(message).not.toContain("secret_cleartext_pass");
        expect(message).toContain("***:***");
      }
    });
  });

  describe("assertTestDatabaseConfigured", () => {
    const originalEnv = process.env.TEST_DATABASE_URL;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.TEST_DATABASE_URL = originalEnv;
      } else {
        delete process.env.TEST_DATABASE_URL;
      }
    });

    it("throws descriptive error when TEST_DATABASE_URL is not set", () => {
      delete process.env.TEST_DATABASE_URL;
      expect(() => assertTestDatabaseConfigured()).toThrow(
        /DATABASE_SAFETY_GUARD.*TEST_DATABASE_URL is not configured/,
      );
    });

    it("throws when TEST_DATABASE_URL points to development database jadara", () => {
      process.env.TEST_DATABASE_URL =
        "postgresql://jadara_user:pass@localhost:5432/jadara";
      expect(() => assertTestDatabaseConfigured()).toThrow(
        /DATABASE_SAFETY_GUARD.*active development database/,
      );
    });

    it("returns validated URL when TEST_DATABASE_URL is valid test database", () => {
      const validUrl =
        "postgresql://jadara_user:pass@localhost:5432/jadara_test";
      process.env.TEST_DATABASE_URL = validUrl;
      const returned = assertTestDatabaseConfigured();
      expect(returned).toBe(validUrl);
    });
  });
});
