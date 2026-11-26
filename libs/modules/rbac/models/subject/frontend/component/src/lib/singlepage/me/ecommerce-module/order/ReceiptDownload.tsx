"use client";

import { useState } from "react";
import { downloadOrderArtifact } from "../../../ecommerce-module/order/create-default/customer-work/ResultReview";

export function ReceiptDownload({
  subjectId,
  orderId,
  receiptId,
  ru,
}: {
  subjectId: string;
  orderId: string;
  receiptId: string;
  ru: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function download() {
    setPending(true);
    setError(false);
    try {
      await downloadOrderArtifact(
        subjectId,
        orderId,
        receiptId,
        `receipt-${orderId}`,
      );
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-50"
      >
        {ru ? "Скачать чек" : "Download receipt"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {ru ? "Чек недоступен." : "The receipt is unavailable."}
        </p>
      )}
    </>
  );
}
