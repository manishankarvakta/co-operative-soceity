import { z } from "zod";

// Bangladeshi phone regex: matches +8801xxxxxxxxx, 8801xxxxxxxxx, 01xxxxxxxxx
const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

export const loginSchema = z.object({
  email: z.string().min(1, "ইমেইল, মোবাইল নম্বর বা মেম্বার আইডি লিখুন।"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"),
  rememberMe: z.boolean().optional().default(false),
});

export const resetRequestSchema = z.object({
  emailOrPhone: z.string().refine((val) => {
    const isEmail = z.string().email().safeParse(val).success;
    const isPhone = bdPhoneRegex.test(val);
    return isEmail || isPhone;
  }, "সঠিক ইমেইল বা ১১ ডিজিটের মোবাইল নম্বর লিখুন।"),
}).strict();

export const resetVerifySchema = z.object({
  emailOrPhone: z.string().refine((val) => {
    const isEmail = z.string().email().safeParse(val).success;
    const isPhone = bdPhoneRegex.test(val);
    return isEmail || isPhone;
  }, "সঠিক ইমেইল বা ১১ ডিজিটের মোবাইল নম্বর লিখুন।"),
  otp: z.string().length(6, "ভেরিফিকেশন কোডটি ৬ ডিজিটের হতে হবে।"),
  newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"),
}).strict();
