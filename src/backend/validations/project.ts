import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3, "প্রজেক্টের নাম কমপক্ষে ৩ অক্ষরের হতে হবে।"),
  location: z.string().min(2, "প্রজেক্টের অবস্থান বা এলাকা উল্লেখ করুন।"),
  targetCapital: z.number().int().positive("টার্গেট মূলধন পজিটিভ হতে হবে।")
}).strict();

export const createInvestmentSchema = z.object({
  projectId: z.string().uuid("সঠিক প্রজেক্ট আইডি দিন।"),
  memberId: z.string().uuid("সঠিক মেম্বার আইডি দিন।"),
  amount: z.number().int().positive("বিনিয়োগের পরিমাণ পজিটিভ হতে হবে।"),
  paymentMode: z.enum(["CASH", "BANK"])
}).strict();
