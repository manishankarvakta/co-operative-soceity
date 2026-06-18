import { z } from "zod";

export const depositItemSchema = z.object({
  type: z.enum(["WEEKLY_SUBSCRIPTION", "ADMISSION_FEE", "PENALTY", "OTHER"]),
  amount: z.number().int().positive("জমার পরিমাণ পজিটিভ হতে হবে।"),
  periodDetails: z.string().min(2, "জমার মাস বা সপ্তাহের বিবরণ উল্লেখ করুন।")
});

export const createDepositSchema = z.object({
  memberId: z.string().uuid("সঠিক মেম্বার আইডি দিন।"),
  paymentMode: z.enum(["CASH", "BANK"]),
  bankAccountId: z.string().uuid("সঠিক ব্যাংক আইডি দিন।").optional().nullable(),
  receiptId: z.string().uuid("রসিদ আপলোড আইডি সঠিক নয়।").optional().nullable(),
  remarks: z.string().optional().nullable(),
  items: z.array(depositItemSchema).min(1, "কমপক্ষে ১টি জমার খাত সিলেক্ট করুন।")
}).strict();
