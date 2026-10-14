/**
 * Test cache reset helper.
 *
 * Flushes or invalidates permission cache entries between test cases
 * using the existing in-memory cache API.
 */

import { cache } from "../../framework/utils/cache.js";

/**
 * Resets permission cache entries.
 *
 * @param userId - Optional user ID. If provided, invalidates only that user's
 * permissions. If omitted, invalidates all permission cache entries.
 */
export async function resetPermissionCache(userId?: number): Promise<void> {
  if (userId !== undefined) {
    await cache.del(`permissions:user:${userId}`);
  } else {
    await cache.delPattern("permissions:user:*");
  }
}
