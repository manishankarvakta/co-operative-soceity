import { z } from "zod";

export const createBankAccountSchema = z.object({
  name: z.string().min(3, "অ্যাকাউন্টের নাম কমপক্ষে ৩ অক্ষরের হতে হবে।"),
  accountNumber: z.string().min(5, "অ্যাকাউন্ট নম্বর কমপক্ষে ৫ অক্ষরের হতে হবে।"),
  initialBalance: z.number().int().nonnegative("প্রারম্ভিক ব্যালেন্স ঋণাত্মক হতে পারবে না।").default(0)
}).strict();

export const createBankTransactionSchema = z.object({
  bankAccountId: z.string().uuid("সঠিক ব্যাংক অ্যাকাউন্ট আইডি দিন।"),
  amount: z.number().int().positive("লেনদেনের পরিমাণ পজিটিভ হতে হবে।"),
  type: z.enum(["DEBIT", "CREDIT"]),
  reference: z.string().optional().nullable()
}).strict();

export const createBankTransferSchema = z.object({
  sourceBankAccountId: z.string().uuid("সঠিক উৎস অ্যাকাউন্ট আইডি দিন।"),
  destinationBankAccountId: z.string().uuid("সঠিক গন্তব্য অ্যাকাউন্ট আইডি দিন।"),
  amount: z.number().int().positive("স্থানান্তরের পরিমাণ পজিটিভ হতে হবে।"),
  reference: z.string().optional().nullable()
}).strict();
