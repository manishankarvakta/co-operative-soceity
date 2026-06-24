import { prisma } from "@/lib/db";
import { ValidationError, NotFoundError } from "@/backend/errors";

export class FiscalYearService {
  /**
   * Creates a new fiscal year.
   * If marked as active, all other fiscal years are automatically deactivated.
   */
  static async createFiscalYear(data: {
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    isActive?: boolean;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError("সঠিক শুরু ও শেষ তারিখ দিন।");
    }

    if (start >= end) {
      throw new ValidationError("শুরুর তারিখ অবশ্যই শেষের তারিখের চেয়ে আগে হতে হবে।");
    }

    // Programmatic Date Lock for Year 1 and Year 2
    const startIso = typeof data.startDate === "string" ? data.startDate : start.toISOString().split("T")[0];
    const endIso = typeof data.endDate === "string" ? data.endDate : end.toISOString().split("T")[0];

    const isFirstYear = data.name.includes("2025-2026") || endIso === "2026-06-30";
    const isSecondYear = data.name.includes("2026-2027") || startIso === "2026-07-01" || endIso === "2027-06-30";

    if (isFirstYear) {
      if (endIso !== "2026-06-30") {
        throw new ValidationError("প্রথম বছরের হিসাবকাল ৩০শে জুন, ২০২৬ইং পর্যন্ত লক করা আছে যা পরিবর্তনযোগ্য নয়।");
      }
    }

    if (isSecondYear) {
      if (startIso !== "2026-07-01" || endIso !== "2027-06-30") {
        throw new ValidationError("২য় বছরের হিসাবকাল ১লা জুলাই, ২০২৬ইং থেকে ৩০শে জুন, ২০২৭ইং পর্যন্ত লক করা আছে যা পরিবর্তনযোগ্য নয়।");
      }
    }

    const isActive = !!data.isActive;

    return await prisma.$transaction(async (tx) => {
      // Check for name uniqueness
      const existing = await tx.fiscalYear.findUnique({
        where: { name: data.name }
      });
      if (existing) {
        throw new ValidationError("এই নামের একটি অর্থবছর ইতিমধ্যে তৈরি করা হয়েছে।");
      }

      if (isActive) {
        // Deactivate all other fiscal years
        await tx.fiscalYear.updateMany({
          data: { isActive: false }
        });
      }

      return await tx.fiscalYear.create({
        data: {
          name: data.name,
          startDate: start,
          endDate: end,
          isActive
        }
      });
    });
  }

  /**
   * Retrieves the currently active fiscal year.
   */
  static async getActiveFiscalYear() {
    return await prisma.fiscalYear.findFirst({
      where: { isActive: true }
    });
  }

  /**
   * Lists all configured fiscal years.
   */
  static async listFiscalYears() {
    return await prisma.fiscalYear.findMany({
      orderBy: { startDate: "desc" }
    });
  }

  /**
   * Activates a fiscal year by ID, deactivating all others.
   */
  static async activateFiscalYear(id: string) {
    return await prisma.$transaction(async (tx) => {
      const target = await tx.fiscalYear.findUnique({
        where: { id }
      });

      if (!target) {
        throw new NotFoundError("অর্থবছর খুঁজে পাওয়া যায়নি।");
      }

      // Deactivate all other fiscal years
      await tx.fiscalYear.updateMany({
        data: { isActive: false }
      });

      // Activate the target one
      return await tx.fiscalYear.update({
        where: { id },
        data: { isActive: true }
      });
    });
  }

  /**
   * Enforces that a given transaction date falls within the boundaries of the active fiscal year.
   * Throws a ValidationError if the date check fails.
   */
  static async validateDate(date: Date | string) {
    const activeFY = await this.getActiveFiscalYear();
    if (!activeFY) {
      throw new ValidationError("সক্রিয় অর্থবছর খুঁজে পাওয়া যায়নি। অনুগ্রহ করে অর্থবছর সেট করুন।");
    }

    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      throw new ValidationError("লেনদেনের তারিখটি সঠিক নয়।");
    }

    // Set checkDate time to mid-day or normalize to verify only date parts if required,
    // but a direct comparison between dates is standard.
    if (checkDate < activeFY.startDate || checkDate > activeFY.endDate) {
      throw new ValidationError(
        `লেনদেনের তারিখটি (${checkDate.toISOString().split("T")[0]}) সক্রিয় অর্থবছর '${activeFY.name}' (${activeFY.startDate.toISOString().split("T")[0]} থেকে ${activeFY.endDate.toISOString().split("T")[0]}) এর বাইরে।`
      );
    }

    return activeFY;
  }
}
