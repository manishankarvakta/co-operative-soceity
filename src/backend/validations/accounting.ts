import { z } from "zod";

export const createAccountSchema = z.object({
  code: z.string().regex(/^\d+$/, "অ্যাকাউন্ট কোড শুধুমাত্র সংখ্যা হতে হবে।").min(3, "কোড কমপক্ষে ৩ সংখ্যার হতে হবে।"),
  name: z.string().min(3, "অ্যাকাউন্টের নাম কমপক্ষে ৩ অক্ষরের হতে হবে।"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"])
}).strict();

export const journalLineSchema = z.object({
  accountCode: z.string().min(3, "অ্যাকাউন্ট কোড দিন।"),
  amount: z.number().int().positive("লেনদেনের পরিমাণ পজিটিভ হতে হবে।"),
  type: z.enum(["DEBIT", "CREDIT"])
}).strict();

export const createJournalEntrySchema = z.object({
  reference: z.string().optional().nullable(),
  description: z.string().min(3, "লেনদেনের সংক্ষিপ্ত বিবরণ দিন।"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "সঠিক তারিখ দিন (YYYY-MM-DD)।"),
  lines: z.array(journalLineSchema).min(2, "কমপক্ষে ২টি জার্নাল লাইন থাকতে হবে।")
}).strict();

export const createProfitDistributionSchema = z.object({
  amount: z.number().int().positive("বন্টনযোগ্য লভ্যাংশের পরিমাণ পজিティブ হতে হবে।"),
  paymentMode: z.enum(["CASH", "BANK"])
}).strict();
