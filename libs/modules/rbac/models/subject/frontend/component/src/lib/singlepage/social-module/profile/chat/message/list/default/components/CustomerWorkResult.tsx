"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderArtifactPath } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { ResultReview } from "../../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview";

interface IProps {
  subjectId: string;
  threadId: string;
  versionId: string;
  language: string;
}

const previewTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function ImagePreview({
  subjectId,
  orderId,
  fileId,
  alt,
}: {
  subjectId: string;
  orderId: string;
  fileId: string;
  alt: string;
}) {
  const { data: blob } = useQuery({
    queryKey: [orderArtifactPath(subjectId, orderId, fileId)],
    queryFn: () =>
      api.orderWork.content({ id: subjectId, orderId, artifactId: fileId }),
    staleTime: Infinity,
  });
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!blob || !previewTypes.has(blob.type)) return;
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return src ? (
    <img
      src={src}
      alt={alt}
      className="max-h-96 max-w-full rounded-lg object-contain"
    />
  ) : null;
}

export function CustomerWorkResult({
  subjectId,
  threadId,
  versionId,
  language,
}: IProps) {
  const { data: task } = api.customerWorkForThread({ id: subjectId, threadId });
  const { data: order } = api.orderWork.read({
    id: subjectId,
    storeId: task?.storeId ?? "",
    taskId: task?.taskId ?? "",
    orderId: task?.orderId ?? "",
  });
  const version = order?.versions.find(({ id }) => id === versionId);
  if (!order || !version) return null;
  if (order.acceptedVersionId && order.acceptedVersionId !== versionId) {
    return (
      <span>
        {language === "ru" ? "Версия" : "Version"} {version.number}
      </span>
    );
  }
  return (
    <>
      {version.previewMimeType && previewTypes.has(version.previewMimeType) && (
        <ImagePreview
          key={version.preview.id}
          subjectId={subjectId}
          orderId={order.orderId}
          fileId={version.preview.id}
          alt={
            language === "ru"
              ? `Превью версии ${version.number}`
              : `Version ${version.number} preview`
          }
        />
      )}
      <ResultReview
        subjectId={subjectId}
        work={{ ...order, versions: [version] }}
        language={language}
      />
      {order.state === "awaiting-payment" && task?.productSlug && (
        <Link
          className="underline"
          href={`/${language}/ecommerce/products/${encodeURIComponent(task.productSlug)}#order-${order.orderId}`}
        >
          {language === "ru" ? "Перейти к заказу" : "View order"}
        </Link>
      )}
    </>
  );
}
