/**
 * Safety guard for automated tests.
 *
 * Ensures tests NEVER connect to or mutate the development database ("jadara")
 * or any production database. Fails closed if the database cannot be positively
 * identified as an authorized test database.
 */

export interface ValidationResult {
  safe: boolean;
  dbName?: string;
  reason?: string;
}

/**
 * Masks credentials in a database URL so it can be safely logged or included
 * in error messages without exposing passwords.
 */
export function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
      return "[MALFORMED_URL]";
    }
    if (parsed.password || parsed.username) {
      parsed.username = "***";
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "[MALFORMED_URL]";
  }
}

/**
 * Extracts the database name from a database URL.
 */
export function parseDatabaseName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, "").split("?")[0].trim();
  } catch {
    return "";
  }
}

/**
 * Validates whether a database URL and environment represent an authorized,
 * isolated test database.
 *
 * Criteria:
 * 1. NODE_ENV must not be "production".
 * 2. URL must be non-empty and syntactically valid.
 * 3. Protocol must be postgresql: or postgres:.
 * 4. Host must not contain production identifiers.
 * 5. Database name must NOT equal "jadara" (the development database).
 * 6. Database name must match test pattern (*_test or *-test).
 */
export function validateTestDatabaseUrl(url: string, nodeEnv?: string): ValidationResult {
  if (nodeEnv === "production") {
    return {
      safe: false,
      reason: "Execution rejected: NODE_ENV is set to 'production'.",
    };
  }

  if (!url || typeof url !== "string" || url.trim() === "") {
    return {
      safe: false,
      reason: "Execution rejected: Database URL is missing or empty.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      safe: false,
      reason: "Execution rejected: Database URL is syntactically invalid.",
    };
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    return {
      safe: false,
      reason: "Execution rejected: Database protocol must be 'postgresql:' or 'postgres:'.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const dbName = parseDatabaseName(url);

  // Blacklist production hosts
  if (
    hostname.includes("prod") ||
    hostname.includes("sytes.net") ||
    hostname.includes("jadara.com")
  ) {
    return {
      safe: false,
      dbName,
      reason: `Execution rejected: Host '${hostname}' appears to be a production environment.`,
    };
  }

  // Blacklist placeholder / unconfigured dummy database
  if (hostname === "no-db.test" || dbName.toLowerCase() === "unconfigured_test") {
    return {
      safe: false,
      dbName,
      reason:
        "Execution rejected: Database URL is the unconfigured dummy placeholder. Live database tests require an explicit, valid TEST_DATABASE_URL.",
    };
  }

  // Blacklist development database explicitly
  if (dbName.toLowerCase() === "jadara") {
    return {
      safe: false,
      dbName,
      reason:
        "Execution rejected: Database 'jadara' is the active development database. Tests must never run against development data.",
    };
  }

  // Blacklist production database names
  if (dbName.toLowerCase().includes("prod")) {
    return {
      safe: false,
      dbName,
      reason: `Execution rejected: Database name '${dbName}' contains production identifier.`,
    };
  }

  // Whitelist: database name must end with '_test' or '-test' (e.g. jadara_test)
  const isTestDbPattern = /^[a-zA-Z0-9_-]+(_test|-test)$/.test(dbName);
  if (!isTestDbPattern) {
    return {
      safe: false,
      dbName,
      reason: `Execution rejected: Database '${dbName}' is not recognized as a test database (must end with '_test').`,
    };
  }

  return {
    safe: true,
    dbName,
  };
}

/**
 * Asserts that the current environment is safe for database tests.
 * Throws an Error if validation fails.
 */
export function assertSafeTestEnvironment(options?: {
  databaseUrl?: string;
  nodeEnv?: string;
}): void {
  const url =
    options?.databaseUrl ??
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "";
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV ?? "test";

  const result = validateTestDatabaseUrl(url, nodeEnv);

  if (!result.safe) {
    const masked = maskDatabaseUrl(url);
    throw new Error(
      `[DATABASE_SAFETY_GUARD] ${result.reason} Target URL: ${masked}`,
    );
  }
}

/**
 * Asserts that TEST_DATABASE_URL is explicitly configured and authorized.
 * Live database test suites must call this in beforeAll() or test setup before
 * initializing Prisma or executing queries.
 */
export function assertTestDatabaseConfigured(): string {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl || testUrl.trim() === "") {
    throw new Error(
      "[DATABASE_SAFETY_GUARD] Database-backed test aborted: TEST_DATABASE_URL is not configured. Live database tests require an explicitly configured, authorized test database (e.g. postgresql://.../jadara_test).",
    );
  }

  assertSafeTestEnvironment({ databaseUrl: testUrl });
  return testUrl;
}
