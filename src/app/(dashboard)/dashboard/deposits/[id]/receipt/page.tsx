"use client";

import { use, useEffect, useState } from "react";
import DepositReceipt from "@/components/widgets/DepositReceipt";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle } from "lucide-react";

interface DepositReceiptPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DepositReceiptPage({ params }: DepositReceiptPageProps) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messages = {
    BN: {
      loading: "লোডিং হচ্ছে...",
      notFound: "জমার বিবরণী পাওয়া যায়নি।",
      fetchError: "জমার তথ্য লোড করতে ব্যর্থ হয়েছে।",
      serverError: "সার্ভারে সমস্যা হয়েছে।"
    },
    EN: {
      loading: "Loading...",
      notFound: "Deposit receipt not found.",
      fetchError: "Failed to load deposit information.",
      serverError: "A server error occurred."
    }
  };

  useEffect(() => {
    const fetchDeposit = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/deposits/${id}`);
        const data = await response.json();
        if (!response.ok || (data.success === false)) {
          setError(data.message || messages[lang].fetchError);
        } else {
          setDeposit(data);
        }
      } catch (err) {
        setError(messages[lang].serverError);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposit();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold dark:text-gray-400">
        {messages[lang].loading}
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="p-8 text-center text-red-500 font-bold flex items-center justify-center gap-1.5">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span>{error || messages[lang].notFound}</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex justify-center">
      <DepositReceipt deposit={deposit} />
    </div>
  );
}
