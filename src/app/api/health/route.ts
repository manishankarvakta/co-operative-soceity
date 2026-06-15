import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { redis } from "../../../lib/redis";

export async function GET() {
  let dbStatus = "disconnected";
  let redisStatus = "disconnected";
  let healthy = true;

  try {
    // Verify PostgreSQL Connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    console.error("[Health Check] Database health check failed:", err);
    healthy = false;
  }

  try {
    // Verify Redis Connection (accounting for real ioredis vs local mock storage)
    if (redis && typeof (redis as any).ping === "function") {
      await (redis as any).ping();
      redisStatus = "connected";
    } else {
      // Mock storage verification fallback
      await redis.set("healthcheck", "1", "EX", 5);
      redisStatus = "connected (mock/fallback)";
    }
  } catch (err) {
    console.error("[Health Check] Redis health check failed:", err);
    healthy = false;
  }

  const payload = {
    status: healthy ? "healthy" : "unhealthy",
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(payload, { status: healthy ? 200 : 500 });
}
