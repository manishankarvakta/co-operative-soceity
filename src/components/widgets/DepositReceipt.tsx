"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { Printer } from "lucide-react";

interface DepositReceiptProps {
  deposit: {
    id: string;
    remarks: string | null;
    paymentMode: "CASH" | "BANK";
    createdAt: string | Date;
    member: {
      name: string;
      memberCode: string;
      phone: string;
      address: string;
    };
    items: Array<{
      id: string;
      type: "WEEKLY_SUBSCRIPTION" | "ADMISSION_FEE" | "PENALTY" | "OTHER" | "LOAN_REPAYMENT";
      amount: number; // in Paisa
      sharesCount: any; // Decimal type from Prisma
      periodDetails: string;
    }>;
    receipt?: {
      imageUrl: string;
    } | null;
  };
}

export default function DepositReceipt({ deposit }: DepositReceiptProps) {
  const { lang } = useLanguage();

  // Parse receipt code and actual remarks
  const remarksString = deposit.remarks || "";
  const hasReceiptCode = remarksString.startsWith("REC-");
  const receiptCode = hasReceiptCode ? remarksString.split(" ")[0] : "REC-N/A";
  const actualRemarks = hasReceiptCode ? remarksString.split(" ").slice(1).join(" ") : remarksString;

  // Calculate totals
  const totalPaisa = deposit.items.reduce((sum, item) => sum + item.amount, 0);
  const totalBdt = totalPaisa / 100;
  const totalShares = deposit.items.reduce((sum, item) => sum + (parseFloat(item.sharesCount) || 0), 0);

  const getDepositTypeName = (type: string, language: "BN" | "EN") => {
    const names = {
      WEEKLY_SUBSCRIPTION: { BN: "সাপ্তাহিক চাঁদা", EN: "Weekly Subscription" },
      ADMISSION_FEE: { BN: "ভর্তি ফি", EN: "Admission Fee" },
      PENALTY: { BN: "জরিমানা (Penalty)", EN: "Penalty" },
      OTHER: { BN: "অন্যান্য", EN: "Other" },
      LOAN_REPAYMENT: { BN: "লোন কিস্তি বাবদ জমা", EN: "Loan Repayment" }
    };
    return names[type as keyof typeof names]?.[language] || type;
  };

  const handlePrint = () => {
    window.print();
  };

  const labels = {
    BN: {
      societyName: "উত্থান বহুমুখী সমবায় সমিতি লিমিটেড",
      societyAddress: "ঢাকা, বাংলাদেশ",
      receiptTitle: "অর্থ প্রাপ্তি রসিদ (অফিস কপি)",
      receiptNo: "রসিদ নং",
      date: "তারিখ",
      memberCode: "সদস্য কোড",
      memberName: "সদস্যের নাম",
      phone: "মোবাইল",
      address: "ঠিকানা",
      paymentMode: "পেমেন্ট মাধ্যম",
      sl: "ক্রমিক",
      depositType: "জমার খাত",
      period: "মাস / সপ্তাহ",
      shares: "শেয়ার সংখ্যা",
      amount: "পরিমাণ (BDT)",
      total: "সর্বমোট পরিমাণ",
      totalShares: "মোট শেয়ার অর্জিত",
      remarks: "বিশেষ মন্তব্য",
      officerSig: "আদায়কারী কর্মকর্তার স্বাক্ষর",
      memberSig: "গ্রাহকের স্বাক্ষর",
      printBtn: "রসিদ প্রিন্ট করুন",
      cash: "ক্যাশ",
      bank: "ব্যাংক"
    },
    EN: {
      societyName: "Utthan Multipurpose Co-operative Society Ltd.",
      societyAddress: "Dhaka, Bangladesh",
      receiptTitle: "Money Receipt (Office Copy)",
      receiptNo: "Receipt No",
      date: "Date",
      memberCode: "Member Code",
      memberName: "Member Name",
      phone: "Phone",
      address: "Address",
      paymentMode: "Payment Method",
      sl: "SL",
      depositType: "Deposit Type",
      period: "Period (Month/Week)",
      shares: "Shares Count",
      amount: "Amount (BDT)",
      total: "Total Amount",
      totalShares: "Total Shares Earned",
      remarks: "Remarks",
      officerSig: "Authorized Signature",
      memberSig: "Member Signature",
      printBtn: "Print Receipt",
      cash: "Cash",
      bank: "Bank"
    }
  };

  const L = labels[lang];

  // Inline styles for the print portal (no Tailwind classes available inside portal)
  const receiptHtml = (
    <div
      id="receipt-printable"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#111",
        background: "#fff",
        padding: "24px",
        maxWidth: "700px",
        margin: "0 auto"
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px" }}>{L.societyName}</h1>
        <p style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 8px" }}>
          {L.societyAddress}
        </p>
        <div style={{ display: "inline-block", border: "1px solid #ddd", borderRadius: "20px", padding: "4px 16px", background: "#f5f5f5" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>{L.receiptTitle}</span>
        </div>
      </div>

      {/* Divider */}
      <hr style={{ borderTop: "2px solid #222", marginBottom: "12px" }} />

      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "13px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #ddd" }}>
        <div>
          <span style={{ color: "#555" }}>{L.receiptNo}: </span>
          <strong style={{ color: "#059669", fontFamily: "monospace" }}>{receiptCode}</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ color: "#555" }}>{L.memberName}: </span>
          <strong>{deposit.member.name}</strong>
        </div>
        <div>
          <span style={{ color: "#555" }}>{L.date}: </span>
          <strong>
            {new Date(deposit.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ color: "#555" }}>{L.memberCode}: </span>
          <strong style={{ fontFamily: "monospace" }}>{deposit.member.memberCode}</strong>
        </div>
        <div>
          <span style={{ color: "#555" }}>{L.paymentMode}: </span>
          <strong>{deposit.paymentMode === "CASH" ? L.cash : L.bank}</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ color: "#555" }}>{L.phone}: </span>
          <strong style={{ fontFamily: "monospace" }}>{deposit.member.phone}</strong>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "12px" }}>
        <thead>
          <tr style={{ background: "#f0f0f0", fontWeight: 700, borderBottom: "2px solid #333" }}>
            <th style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "center", width: "40px" }}>{L.sl}</th>
            <th style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "left" }}>{L.depositType}</th>
            <th style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "left" }}>{L.period}</th>
            <th style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "center" }}>{L.shares}</th>
            <th style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "right" }}>{L.amount}</th>
          </tr>
        </thead>
        <tbody>
          {deposit.items.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "6px 8px", border: "1px solid #ccc", textAlign: "center", fontFamily: "monospace" }}>
                {lang === "BN" ? (index + 1).toLocaleString("bn-BD") : index + 1}
              </td>
              <td style={{ padding: "6px 8px", border: "1px solid #ccc", fontWeight: 600 }}>
                {getDepositTypeName(item.type, lang)}
              </td>
              <td style={{ padding: "6px 8px", border: "1px solid #ccc", color: "#555" }}>
                {item.periodDetails}
              </td>
              <td style={{ padding: "6px 8px", border: "1px solid #ccc", textAlign: "center", fontFamily: "monospace" }}>
                {parseFloat(item.sharesCount) > 0
                  ? (lang === "BN" ? parseFloat(item.sharesCount).toLocaleString("bn-BD") : parseFloat(item.sharesCount))
                  : "-"}
              </td>
              <td style={{ padding: "6px 8px", border: "1px solid #ccc", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                {(item.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0f0f0", fontWeight: 700, borderTop: "2px solid #333" }}>
            <td colSpan={3} style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "right" }}>
              {L.total}:
            </td>
            <td style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "center", fontFamily: "monospace", color: "#059669" }}>
              {totalShares > 0 ? (lang === "BN" ? totalShares.toLocaleString("bn-BD") : totalShares) : "-"}
            </td>
            <td style={{ padding: "7px 8px", border: "1px solid #ccc", textAlign: "right", fontFamily: "monospace", color: "#059669" }}>
              {totalBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Remarks */}
      {actualRemarks && (
        <div style={{ marginBottom: "24px", padding: "8px 12px", background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "12px" }}>
          <strong>{L.remarks}:</strong> {actualRemarks}
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", textAlign: "center", fontSize: "12px", fontWeight: 600 }}>
        <div>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", color: "#444" }}>{L.memberSig}</div>
        </div>
        <div>
          <div style={{ borderTop: "1px solid #555", paddingTop: "8px", color: "#444" }}>{L.officerSig}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Screen-only controls */}
      <div className="flex justify-end items-center mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>{L.printBtn}</span>
        </button>
      </div>

      {/* Screen preview of the receipt */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        {receiptHtml}
      </div>
    </div>
  );
}
