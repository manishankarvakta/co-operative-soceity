import { z } from "zod";

export const applyLoanSchema = z.object({
  memberId: z.string().uuid("সদস্য আইডি সঠিক নয়।").optional(),
  amount: z.number().int().positive("ঋণের পরিমাণ অবশ্যই পজিটিভ হতে হবে।"),
  interestRate: z.number().positive("সুদের হার অবশ্যই পজিটিভ হতে হবে।"),
  durationMonths: z.number().int().positive("ঋণের মেয়াদ অবশ্যই পজিটিভ হতে হবে।").optional(),
  durationType: z.enum(["MONTHLY", "WEEKLY"]).optional().default("MONTHLY"),
  durationValue: z.number().int().positive("ঋণের মেয়াদ অবশ্যই পজিটিভ হতে হবে।"),
  guarantor1Id: z.string().uuid("প্রথম জামিনদার সদস্য আইডি সঠিক নয়।"),
  guarantor2Id: z.string().uuid("দ্বিতীয় জামিনদার সদস্য আইডি সঠিক নয়।").optional().nullable(),
  bypassLimit: z.boolean().optional().default(false),
  remarks: z.string().optional().nullable()
}).strict();

export const approveLoanSchema = z.object({
  loanId: z.string().uuid("ঋণ আইডি সঠিক নয়।"),
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "স্ট্যাটাস অবশ্যই APPROVED অথবা REJECTED হতে হবে।" })
  }),
  paymentMode: z.enum(["CASH", "BANK"], {
    errorMap: () => ({ message: "পেমেন্ট মোড অবশ্যই CASH অথবা BANK হতে হবে।" })
  }).optional().default("CASH"),
  bankAccountId: z.string().uuid("ব্যাংক অ্যাকাউন্ট আইডি সঠিক নয়।").optional().nullable(),
  remarks: z.string().optional().nullable(),
  approveAsRole: z.enum(["PRESIDENT", "SECRETARY", "TREASURER"]).optional().nullable()
}).strict().refine((data) => {
  if (data.status === "APPROVED" && data.paymentMode === "BANK" && !data.bankAccountId) {
    return false;
  }
  return true;
}, {
  message: "ব্যাংক পেমেন্টের জন্য ব্যাংক অ্যাকাউন্ট নির্বাচন করা আবশ্যক।",
  path: ["bankAccountId"]
});

export const loanPaymentSchema = z.object({
  loanId: z.string().uuid("ঋণ আইডি সঠিক নয়।"),
  amount: z.number().int().positive("পেমেন্টের পরিমাণ অবশ্যই পজিটিভ হতে হবে।"),
  paymentMode: z.enum(["CASH", "BANK"], {
    errorMap: () => ({ message: "পেমেন্ট মোড অবশ্যই CASH অথবা BANK হতে হবে।" })
  }),
  bankAccountId: z.string().uuid("ব্যাংক অ্যাকাউন্ট আইডি সঠিক নয়।").optional().nullable(),
  remarks: z.string().optional().nullable()
}).strict().refine((data) => {
  if (data.paymentMode === "BANK" && !data.bankAccountId) {
    return false;
  }
  return true;
}, {
  message: "ব্যাংক পেমেন্টের জন্য ব্যাংক অ্যাকাউন্ট নির্বাচন করা আবশ্যক।",
  path: ["bankAccountId"]
});
