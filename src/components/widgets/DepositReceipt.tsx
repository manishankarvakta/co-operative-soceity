"use client";

import { useState } from "react";

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
      type: "WEEKLY_SUBSCRIPTION" | "ADMISSION_FEE" | "PENALTY" | "OTHER";
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
  const [lang, setLang] = useState<"BN" | "EN">("BN");

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
      OTHER: { BN: "অন্যান্য", EN: "Other" }
    };
    return names[type as keyof typeof names]?.[language] || type;
  };

  const handlePrint = () => {
    window.print();
  };

  const labels = {
    BN: {
      societyName: "উত্থান বহুমুখী সমবায় সমিতি লিমিটেড",
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
      shares: "শেয়ার সংখ্যা",
      amount: "পরিমাণ (BDT)",
      total: "সর্বমোট পরিমাণ",
      totalShares: "মোট শেয়ার অর্জিত",
      remarks: "বিশেষ মন্তব্য",
      officerSig: "আদায়কারী কর্মকর্তার স্বাক্ষর",
      memberSig: "গ্রাহকের স্বাক্ষর",
      printBtn: "রসিদ প্রিন্ট করুন",
      backBtn: "তালিকায় ফিরে যান",
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
      backBtn: "Back to List",
      cash: "Cash",
      bank: "Bank"
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-md transition-all print:border-0 print:shadow-none print:p-0">
      {/* Control Actions (Hidden on Print) */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100 dark:border-zinc-800 print:hidden">
        <button
          type="button"
          onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
        >
          {lang === "BN" ? "Switch to English" : "বাংলায় দেখুন"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow transition"
          >
            🖨️ {labels[lang].printBtn}
          </button>
        </div>
      </div>

      {/* Printable Area Starts Here */}
      <div className="p-8 border-4 border-double border-gray-300 rounded-lg dark:border-zinc-700 bg-white dark:bg-zinc-900 print:border-0 print:p-0">
        {/* Header Block */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-1 tracking-tight">
            {labels[lang].societyName}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase font-semibold tracking-wider">
            {labels[lang].societyAddress}
          </p>
          <div className="inline-block px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-zinc-700">
            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">
              {labels[lang].receiptTitle}
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4 border-gray-150 dark:border-zinc-800">
          <div className="space-y-1">
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].receiptNo}:</span>{" "}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">{receiptCode}</strong>
            </div>
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].date}:</span>{" "}
              <strong className="text-gray-800 dark:text-white">
                {new Date(deposit.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </strong>
            </div>
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].paymentMode}:</span>{" "}
              <strong className="text-gray-850 dark:text-zinc-200">
                {deposit.paymentMode === "CASH" ? labels[lang].cash : labels[lang].bank}
              </strong>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].memberName}:</span>{" "}
              <strong className="text-gray-850 dark:text-zinc-200">{deposit.member.name}</strong>
            </div>
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].memberCode}:</span>{" "}
              <strong className="font-mono text-gray-850 dark:text-zinc-200">{deposit.member.memberCode}</strong>
            </div>
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">{labels[lang].phone}:</span>{" "}
              <span className="text-gray-800 dark:text-white font-mono">{deposit.member.phone}</span>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <table className="w-full text-left text-sm mb-6 border border-gray-300 dark:border-zinc-700 border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-b border-gray-300 dark:border-zinc-700 font-bold">
              <th className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 w-12 text-center">{labels[lang].sl}</th>
              <th className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700">{labels[lang].depositType}</th>
              <th className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700">{labels[lang].period}</th>
              <th className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-center">{labels[lang].shares}</th>
              <th className="px-3 py-2 text-right">{labels[lang].amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
            {deposit.items.map((item, index) => (
              <tr key={item.id} className="text-gray-700 dark:text-zinc-300">
                <td className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-center font-mono">
                  {lang === "BN" ? (index + 1).toLocaleString("bn-BD") : index + 1}
                </td>
                <td className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 font-semibold">
                  {getDepositTypeName(item.type, lang)}
                </td>
                <td className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400">
                  {item.periodDetails}
                </td>
                <td className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-center font-mono">
                  {parseFloat(item.sharesCount) > 0 ? (lang === "BN" ? parseFloat(item.sharesCount).toLocaleString("bn-BD") : parseFloat(item.sharesCount)) : "-"}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {(item.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-zinc-800 border-t border-gray-300 dark:border-zinc-700 font-bold text-gray-800 dark:text-white">
              <td colSpan={3} className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-right">
                {labels[lang].total}:
              </td>
              <td className="px-3 py-2 border-r border-gray-300 dark:border-zinc-700 text-center font-mono text-emerald-700 dark:text-emerald-400">
                {totalShares > 0 ? (lang === "BN" ? totalShares.toLocaleString("bn-BD") : totalShares) : "-"}
              </td>
              <td className="px-3 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                {totalBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Remarks Column */}
        {actualRemarks && (
          <div className="mb-8 p-3 bg-gray-50 dark:bg-zinc-850 rounded border text-xs text-gray-650 dark:text-zinc-300">
            <strong>{labels[lang].remarks}:</strong> {actualRemarks}
          </div>
        )}

        {/* Payment Slip Attachment Display if any */}
        {deposit.receipt && (
          <div className="mb-8 p-3 border rounded border-gray-250 dark:border-zinc-700 print:hidden">
            <span className="block text-xs font-bold text-gray-500 mb-2 uppercase">Payment Slip Attachment</span>
            <img
              src={deposit.receipt.imageUrl}
              alt="Payment Slip"
              className="max-h-48 object-contain rounded border border-gray-200 bg-gray-50"
            />
          </div>
        )}

        {/* Footer / Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm font-semibold">
          <div className="flex flex-col items-center">
            <div className="w-48 border-t border-gray-400 dark:border-zinc-650 pt-2 text-gray-600 dark:text-zinc-400">
              {labels[lang].memberSig}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 border-t border-gray-400 dark:border-zinc-650 pt-2 text-gray-600 dark:text-zinc-400">
              {labels[lang].officerSig}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
