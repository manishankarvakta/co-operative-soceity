import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export class AuditService {
  /**
   * Writes an audit entry into the AuditLog table.
   * Resolves client IP dynamically if running inside an HTTP request context.
   */
  static async log(params: {
    userId?: string | null;
    action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT";
    tableName: string;
    recordId?: string | null;
    oldData?: any | null;
    newData?: any | null;
    ipAddress?: string | null;
    tx?: any;
  }) {
    let clientIp = params.ipAddress || null;

    if (!clientIp) {
      try {
        const headerList = await headers();
        clientIp = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
        // If x-forwarded-for contains a list of IPs, take the first client IP
        if (clientIp && clientIp.includes(",")) {
          clientIp = clientIp.split(",")[0].trim();
        }
      } catch {
        // Fallback for non-HTTP request contexts (e.g., test suite or background crons)
        clientIp = "127.0.0.1";
      }
    }

    const prismaClient = params.tx || prisma;

    // Serialize object values safely into raw objects (strips non-JSON properties)
    const oldVal = params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : null;
    const newVal = params.newData ? JSON.parse(JSON.stringify(params.newData)) : null;

    let validUserId: string | null = null;
    if (params.userId) {
      try {
        const userExists = await prismaClient.user.findUnique({
          where: { id: params.userId },
          select: { id: true }
        });
        if (userExists) {
          validUserId = params.userId;
        }
      } catch (err) {
        console.warn("[AuditService] Invalid or non-existent userId for audit log:", params.userId, err);
      }
    }

    try {
      return await prismaClient.auditLog.create({
        data: {
          userId: validUserId,
          action: params.action,
          tableName: params.tableName,
          recordId: params.recordId || null,
          oldData: oldVal,
          newData: newVal,
          ipAddress: clientIp,
          timestamp: new Date()
        }
      });
    } catch (err) {
      console.error("[AuditService] Writing audit log failed:", err);
      // Suppress logging errors to prevent blocking the actual business transactions
      return null;
    }
  }
}
