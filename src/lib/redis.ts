import Redis from "ioredis";

// Instantiate the Redis client using environment variables
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let client: Redis | null = null;
let useFallback = false;
const mockStorage = new Map<string, string>();

try {
  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Fail quickly to engage fallback
    connectTimeout: 2000,
    lazyConnect: true,
  });

  client.on("error", (err: any) => {
    // Only warn outside test environments to suppress aggregate output spam during Jest suites
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Redis] Connection error, switching/staying in fallback mode:", err.message || err);
    }
    useFallback = true;
  });

  client.on("connect", () => {
    console.info("[Redis] Connected successfully.");
    useFallback = false;
  });
} catch (error) {
  console.warn("[Redis] Failed to initialize Redis client, using mock fallback:", error);
  useFallback = true;
}

const mockRedis = {
  get: async (key: string) => {
    return mockStorage.get(key) || null;
  },
  set: async (key: string, value: string, ...options: any[]) => {
    let exSeconds: number | null = null;
    let nx = false;

    for (let i = 0; i < options.length; i++) {
      const opt = String(options[i]).toUpperCase();
      if (opt === "EX" && i + 1 < options.length) {
        exSeconds = parseInt(options[i + 1], 10);
      }
      if (opt === "NX") {
        nx = true;
      }
    }

    if (nx && mockStorage.has(key)) {
      return null; // NX condition failed (key exists)
    }

    mockStorage.set(key, value);

    if (exSeconds) {
      const timer = setTimeout(() => mockStorage.delete(key), exSeconds * 1000);
      if (timer.unref) timer.unref();
    }

    return "OK";
  },
  del: async (key: string) => {
    mockStorage.delete(key);
    return 1;
  },
  ping: async () => {
    return "PONG";
  }
};

const redisProxy = new Proxy({} as Redis, {
  get(target, prop) {
    if (prop === "on") {
      return (event: string, callback: Function) => {
        if (client) {
          client.on(event, callback as any);
        }
      };
    }

    return async (...args: any[]) => {
      if (!useFallback && client) {
        try {
          const fn = (client as any)[prop];
          if (typeof fn === "function") {
            return await fn.apply(client, args);
          }
        } catch (err: any) {
          if (process.env.NODE_ENV !== "test") {
            console.warn(`[Redis] Command '${String(prop)}' execution failed, falling back to mock storage:`, err.message || err);
          }
          useFallback = true;
        }
      }

      const fallbackFn = (mockRedis as any)[prop];
      if (typeof fallbackFn === "function") {
        return await fallbackFn.apply(mockRedis, args);
      }

      if (process.env.NODE_ENV !== "test") {
        console.warn(`[Redis] Fallback method '${String(prop)}' is not implemented.`);
      }
      return null;
    };
  }
});

export { redisProxy as redis };
