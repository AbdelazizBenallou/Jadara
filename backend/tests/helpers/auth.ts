/**
 * Test authentication helper.
 *
 * Generates signed JWT tokens and Authorization headers for testing
 * role-based access without querying the database or invoking login routes.
 */

import { jwtUtils, type AccessTokenPayload } from "../../framework/utils/jwt.js";

export interface TestUserPayload {
  userId: number;
  email?: string;
  role: string;
}

/**
 * Creates a valid JWT access token for the given user payload.
 */
export function createTestToken(payload: TestUserPayload): string {
  const tokenPayload: AccessTokenPayload = {
    userId: payload.userId,
    email: payload.email ?? `user_${payload.userId}@example.com`,
    role: payload.role,
  };

  return jwtUtils.signAccessToken(tokenPayload);
}

/**
 * Creates a Bearer Authorization header object for HTTP testing.
 */
export function createAuthHeader(payload: TestUserPayload): { Authorization: string } {
  return {
    Authorization: `Bearer ${createTestToken(payload)}`,
  };
}
