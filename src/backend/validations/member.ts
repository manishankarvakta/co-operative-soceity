import { z } from "zod";

const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

export const nomineeSchema = z.object({
  name: z.string().min(2, "নমিনীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।"),
  relationship: z.string().min(2, "সম্পর্ক উল্লেখ করুন।"),
  phone: z.string().regex(bdPhoneRegex, "নমিনীর সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।"),
  address: z.string().min(5, "নমিনীর ঠিকানা কমপক্ষে ৫ অক্ষরের হতে হবে।"),
  emergencyContact: z.string().min(5, "জরুরি যোগাযোগের বিবরণ দিন।")
});

export const createMemberSchema = z.object({
  name: z.string().min(2, "সদস্যের নাম কমপক্ষে ২ অক্ষরের হতে হবে।"),
  phone: z.string().regex(bdPhoneRegex, "সদস্যের সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।"),
  email: z.string().email("সঠিক ইমেইল ঠিকানা লিখুন।").optional().or(z.literal("")),
  address: z.string().min(5, "সদস্যের বর্তমান ঠিকানা লিখুন।"),
  joinDate: z.string().refine((val) => !isNaN(Date.parse(val)), "ভর্তির সঠিক তারিখ উল্লেখ করুন।"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  nominee: nomineeSchema,
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।").optional(),
  paymentMode: z.enum(["CASH", "BANK"]).optional(),
  bankAccountId: z.string().optional(),
  admissionFee: z.number().optional(),
  role: z.enum(["MEMBER", "ACCOUNTANT", "SUPER_ADMIN"]).default("MEMBER").optional()
}).strict();

export const updateMemberSchema = z.object({
  name: z.string().min(2, "সদস্যের নাম কমপক্ষে ২ অক্ষরের হতে হবে।").optional(),
  phone: z.string().regex(bdPhoneRegex, "সদস্যের সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।").optional(),
  email: z.string().email("সঠিক ইমেইল ঠিকানা লিখুন।").optional().or(z.literal("")),
  address: z.string().min(5, "সদস্যের বর্তমান ঠিকানা লিখুন।").optional(),
  joinDate: z.string().refine((val) => !isNaN(Date.parse(val)), "ভর্তির সঠিক তারিখ উল্লেখ করুন।").optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  nominee: nomineeSchema.partial().optional()
}).strict();

export const deathTransferSchema = z.object({
  deceasedMemberId: z.string().uuid("মৃত সদস্যের আইডি সঠিক নয়।"),
  recipientType: z.enum(["NOMINEE", "MEMBER"], {
    errorMap: () => ({ message: "গ্রহীতার ধরণ অবশ্যই NOMINEE অথবা MEMBER হতে হবে।" })
  }),
  recipientId: z.string().uuid("গ্রহীতা সদস্যের আইডি সঠিক নয়।").optional()
}).strict().refine((data) => {
  if (data.recipientType === "MEMBER" && !data.recipientId) {
    return false;
  }
  return true;
}, {
  message: "গ্রহীতা সদস্যের আইডি প্রয়োজন যখন গ্রহীতার ধরণ MEMBER নির্বাচন করা হয়।",
  path: ["recipientId"]
});
