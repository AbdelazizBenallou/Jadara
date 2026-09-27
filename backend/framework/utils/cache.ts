// In-memory cache (no Redis dependency)
const store = new Map<string, { value: string; expiresAt: number }>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000).unref();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    store.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
  },

  async del(key: string): Promise<void> {
    store.delete(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const re = new RegExp(`^${escaped}$`);
    for (const key of store.keys()) {
      if (re.test(key)) {
        store.delete(key);
      }
    }
  },

  async exists(key: string): Promise<boolean> {
    const entry = store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return false;
    }
    return true;
  },
};
