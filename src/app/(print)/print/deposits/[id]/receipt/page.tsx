"use client";

import { use, useEffect, useState, useRef } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

interface PrintReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default function PrintDepositReceiptPage({ params }: PrintReceiptPageProps) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didAutoPrint = useRef(false);

  useEffect(() => {
    const fetchDeposit = async () => {
      try {
        const response = await fetch(`/api/deposits/${id}`);
        const data = await response.json();
        if (!response.ok || data.success === false) {
          setError(data.message || "Receipt not found.");
        } else {
          setDeposit(data);
        }
      } catch {
        setError("Server error.");
      } finally {
        setLoading(false);
      }
    };
    fetchDeposit();
  }, [id]);

  // Auto-trigger print dialog once the receipt is loaded
  useEffect(() => {
    if (deposit && !didAutoPrint.current) {
      didAutoPrint.current = true;
      setTimeout(() => window.print(), 400);
    }
  }, [deposit]);

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
      paymentMode: "পেমেন্ট মাধ্যম",
      sl: "ক্রমিক",
      depositType: "জমার খাত",
      period: "মাস / সপ্তাহ",
      shares: "শেয়ার সংখ্যা",
      amount: "পরিমাণ (BDT)",
      total: "সর্বমোট পরিমাণ",
      remarks: "বিশেষ মন্তব্য",
      officerSig: "আদায়কারী কর্মকর্তার স্বাক্ষর",
      memberSig: "গ্রাহকের স্বাক্ষর",
      printBtn: "প্রিন্ট করুন",
      closeBtn: "বন্ধ করুন",
      cash: "ক্যাশ",
      bank: "ব্যাংক",
      loading: "লোডিং হচ্ছে...",
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
      paymentMode: "Payment Method",
      sl: "SL",
      depositType: "Deposit Type",
      period: "Period (Month/Week)",
      shares: "Shares Count",
      amount: "Amount (BDT)",
      total: "Total Amount",
      remarks: "Remarks",
      officerSig: "Authorized Signature",
      memberSig: "Member Signature",
      printBtn: "Print",
      closeBtn: "Close",
      cash: "Cash",
      bank: "Bank",
      loading: "Loading...",
    }
  };

  const getDepositTypeName = (type: string) => {
    const names: Record<string, { BN: string; EN: string }> = {
      WEEKLY_SUBSCRIPTION: { BN: "সাপ্তাহিক চাঁদা", EN: "Weekly Subscription" },
      ADMISSION_FEE: { BN: "ভর্তি ফি", EN: "Admission Fee" },
      PENALTY: { BN: "জরিমানা (Penalty)", EN: "Penalty" },
      OTHER: { BN: "অন্যান্য", EN: "Other" },
      LOAN_REPAYMENT: { BN: "লোন কিস্তি বাবদ জমা", EN: "Loan Repayment" }
    };
    return names[type]?.[lang] || type;
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Arial, sans-serif", color: "#555" }}>
      {labels[lang].loading}
    </div>
  );

  if (error || !deposit) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Arial, sans-serif", color: "#c00" }}>
      ⚠️ {error || "Receipt not found."}
    </div>
  );

  const remarksString = deposit.remarks || "";
  const hasReceiptCode = remarksString.startsWith("REC-");
  const receiptCode = hasReceiptCode ? remarksString.split(" ")[0] : "REC-N/A";
  const actualRemarks = hasReceiptCode ? remarksString.split(" ").slice(1).join(" ") : remarksString;
  const totalPaisa = deposit.items.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalBdt = totalPaisa / 100;
  const totalShares = deposit.items.reduce((sum: number, item: any) => sum + (parseFloat(item.sharesCount) || 0), 0);
  const L = labels[lang];

  return (
    <>
      {/* Print-only global styles — scoped to this page */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; font-family: 'Segoe UI', Arial, sans-serif; color: #111; }

        @page {
          size: A4 portrait;
          margin: 15mm 12mm;
        }

        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }

        .receipt-wrapper {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px;
        }

        /* Action bar — hidden when printing */
        .action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 0 20px;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        .btn {
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          border: none;
        }
        .btn-print { background: #059669; color: #fff; }
        .btn-print:hover { background: #047857; }
        .btn-close { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
        .btn-close:hover { background: #e5e7eb; }

        /* Receipt card */
        .receipt-card {
          border: 2px solid #333;
          padding: 28px;
          border-radius: 6px;
        }

        .receipt-header { text-align: center; margin-bottom: 18px; }
        .society-name { font-size: 20px; font-weight: 900; margin-bottom: 3px; }
        .society-address { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .receipt-badge {
          display: inline-block;
          border: 1px solid #ccc;
          border-radius: 20px;
          padding: 3px 16px;
          background: #f5f5f5;
          font-size: 13px;
          font-weight: 700;
        }

        .divider { border: none; border-top: 2px solid #222; margin: 14px 0; }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px 12px;
          font-size: 13px;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #ddd;
        }
        .info-right { text-align: right; }
        .info-label { color: #555; }
        .info-value { font-weight: 700; }
        .info-mono { font-family: 'Courier New', monospace; }
        .info-green { color: #059669; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
        th { background: #f0f0f0; font-weight: 700; padding: 7px 8px; border: 1px solid #bbb; }
        td { padding: 6px 8px; border: 1px solid #d0d0d0; }
        tfoot td { background: #f0f0f0; font-weight: 700; border-top: 2px solid #333; }

        .remarks-box {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          padding: 8px 12px;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .sig-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 60px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
        }
        .sig-line {
          border-top: 1px solid #777;
          padding-top: 8px;
          color: #444;
        }
      `}</style>

      <div className="receipt-wrapper">
        {/* Action toolbar — hidden on print */}
        <div className="action-bar no-print">
          <button className="btn btn-close" onClick={() => window.close()}>
            ✕ {L.closeBtn}
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            🖨️ {L.printBtn}
          </button>
        </div>

        {/* The actual receipt that prints */}
        <div className="receipt-card">
          {/* Header */}
          <div className="receipt-header">
            <div className="society-name">{L.societyName}</div>
            <div className="society-address">{L.societyAddress}</div>
            <span className="receipt-badge">{L.receiptTitle}</span>
          </div>

          <hr className="divider" />

          {/* Info Grid */}
          <div className="info-grid">
            <div>
              <span className="info-label">{L.receiptNo}: </span>
              <span className="info-value info-mono info-green">{receiptCode}</span>
            </div>
            <div className="info-right">
              <span className="info-label">{L.memberName}: </span>
              <span className="info-value">{deposit.member.name}</span>
            </div>
            <div>
              <span className="info-label">{L.date}: </span>
              <span className="info-value">
                {new Date(deposit.createdAt).toLocaleDateString(lang === "BN" ? "bn-BD" : "en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </span>
            </div>
            <div className="info-right">
              <span className="info-label">{L.memberCode}: </span>
              <span className="info-value info-mono">{deposit.member.memberCode}</span>
            </div>
            <div>
              <span className="info-label">{L.paymentMode}: </span>
              <span className="info-value">{deposit.paymentMode === "CASH" ? L.cash : L.bank}</span>
            </div>
            <div className="info-right">
              <span className="info-label">{L.phone}: </span>
              <span className="info-value info-mono">{deposit.member.phone}</span>
            </div>
          </div>

          {/* Items Table */}
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "center", width: "40px" }}>{L.sl}</th>
                <th style={{ textAlign: "left" }}>{L.depositType}</th>
                <th style={{ textAlign: "left" }}>{L.period}</th>
                <th style={{ textAlign: "center" }}>{L.shares}</th>
                <th style={{ textAlign: "right" }}>{L.amount}</th>
              </tr>
            </thead>
            <tbody>
              {deposit.items.map((item: any, index: number) => (
                <tr key={item.id}>
                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                    {lang === "BN" ? (index + 1).toLocaleString("bn-BD") : index + 1}
                  </td>
                  <td style={{ fontWeight: 600 }}>{getDepositTypeName(item.type)}</td>
                  <td style={{ color: "#555" }}>{item.periodDetails}</td>
                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                    {parseFloat(item.sharesCount) > 0
                      ? (lang === "BN" ? parseFloat(item.sharesCount).toLocaleString("bn-BD") : parseFloat(item.sharesCount))
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                    {(item.amount / 100).toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }}>{L.total}:</td>
                <td style={{ textAlign: "center", fontFamily: "monospace", color: "#059669" }}>
                  {totalShares > 0 ? (lang === "BN" ? totalShares.toLocaleString("bn-BD") : totalShares) : "—"}
                </td>
                <td style={{ textAlign: "right", fontFamily: "monospace", color: "#059669" }}>
                  {totalBdt.toLocaleString(lang === "BN" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Remarks */}
          {actualRemarks && (
            <div className="remarks-box">
              <strong>{L.remarks}:</strong> {actualRemarks}
            </div>
          )}

          {/* Signatures */}
          <div className="sig-row">
            <div><div className="sig-line">{L.memberSig}</div></div>
            <div><div className="sig-line">{L.officerSig}</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
