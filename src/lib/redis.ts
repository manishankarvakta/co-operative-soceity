import Redis from "ioredis";

// Instantiate the Redis client using environment variables
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  
  redis.on("error", (err: any) => {
    console.error("Redis Connection Error:", err);
  });
} catch (error) {
  console.error("Failed to initialize Redis:", error);
  // Fallback fallback mechanism if redis is not running locally during build/testing stages
  const mockStorage = new Map<string, string>();
  redis = {
    get: async (key: string) => mockStorage.get(key) || null,
    set: async (key: string, value: string, mode?: string, duration?: number) => {
      mockStorage.set(key, value);
      if (mode === "EX" && duration) {
        const timer = setTimeout(() => mockStorage.delete(key), duration * 1000);
        if (typeof timer.unref === "function") {
          timer.unref();
        }
      }
      return "OK";
    },
    del: async (key: string) => {
      mockStorage.delete(key);
      return 1;
    },
  } as unknown as Redis;
}

export { redis };
