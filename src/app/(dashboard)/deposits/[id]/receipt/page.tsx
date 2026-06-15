"use client";

import { useEffect, useState } from "react";
import DepositReceipt from "../../../../components/widgets/DepositReceipt";

interface DepositReceiptPageProps {
  params: {
    id: string;
  };
}

export default function DepositReceiptPage({ params }: DepositReceiptPageProps) {
  const { id } = params;
  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeposit = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/deposits/${id}`);
        const data = await response.json();
        if (!response.ok || (data.success === false)) {
          setError(data.message || "জমার তথ্য লোড করতে ব্যর্থ হয়েছে।");
        } else {
          setDeposit(data);
        }
      } catch (err) {
        setError("সার্ভারে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchDeposit();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold dark:text-gray-400">
        লোডিং হচ্ছে (Loading)...
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        ⚠️ {error || "জমার বিবরণী পাওয়া যায়নি।"}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex justify-center">
      <DepositReceipt deposit={deposit} />
    </div>
  );
}
