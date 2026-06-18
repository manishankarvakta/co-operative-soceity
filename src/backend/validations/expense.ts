import { z } from "zod";

export const createExpenseSchema = z.object({
  category: z.string().min(2, "খরচের ক্যাটাগরি উল্লেখ করুন।"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "সঠিক তারিখ দিন (YYYY-MM-DD)।"),
  amount: z.number().int().positive("খরচের পরিমাণ পজিটিভ হতে হবে।"),
  projectId: z.string().uuid("সঠিক প্রজেক্ট আইডি দিন।").optional().nullable(),
  location: z.string().min(2, "খরচের স্থান বা বিবরণ দিন।").optional().nullable(),
  receiptId: z.string().uuid("রসিদ আপলোড আইডি সঠিক নয়।").optional().nullable(),
  paymentMode: z.enum(["CASH", "BANK"]),
  bankAccountId: z.string().uuid("সঠিক ব্যাংক আইডি দিন।").optional().nullable(),
  projectName: z.string().optional().nullable()
}).strict();
