/**
 * Vitest Global Test Setup & Database Safety Boundary.
 *
 * This setup file runs before any test file is evaluated in the Vitest runner.
 * It enforces that tests NEVER connect to or inherit the active development
 * database ("jadara") or any production database.
 */

import { validateTestDatabaseUrl } from "./helpers/envGuard.js";

// 1. Production environment lockout
if (process.env.NODE_ENV === "production") {
  throw new Error("FATAL SAFETY ERROR: Test runner cannot execute in a production environment.");
}

process.env.NODE_ENV = "test";

// 2. Reject development database if present in environment
const currentUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";
if (currentUrl) {
  try {
    const parsed = new URL(currentUrl);
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0].trim().toLowerCase();
    if (dbName === "jadara") {
      throw new Error(
        "FATAL SAFETY ERROR: Test runner detected active development database 'jadara'. Tests must never target the development database.",
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("FATAL SAFETY ERROR")) {
      throw err;
    }
  }
}

// 3. Neutralize fallback to backend/.env
// If TEST_DATABASE_URL is explicitly set, validate it and use it.
// If TEST_DATABASE_URL is not set, poison DATABASE_URL with a non-connectable dummy test URL
// so that any module invoking dotenv.config() will NOT load 'jadara' from .env.
if (process.env.TEST_DATABASE_URL) {
  const validation = validateTestDatabaseUrl(process.env.TEST_DATABASE_URL, "test");
  if (!validation.safe) {
    throw new Error(
      `FATAL SAFETY ERROR: Configured TEST_DATABASE_URL is unsafe: ${validation.reason}`,
    );
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  process.env.DATABASE_URL = "postgresql://unconfigured:unconfigured@no-db.test:5432/unconfigured_test";
}
