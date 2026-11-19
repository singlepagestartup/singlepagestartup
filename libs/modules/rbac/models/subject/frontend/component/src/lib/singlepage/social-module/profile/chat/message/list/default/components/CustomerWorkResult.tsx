"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderArtifactPath } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";

interface IProps {
  subjectId: string;
  threadId: string;
  versionId: string;
  language: string;
  onReview?: (versionId: string) => void;
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
  onReview,
}: IProps) {
  const task = api.customerWorkForThread({ id: subjectId, threadId });
  const work = task.isError ? undefined : task.data;
  const orderResult = api.orderWork.read({
    id: subjectId,
    storeId: work?.storeId ?? "",
    taskId: work?.taskId ?? "",
    orderId: work?.orderId ?? "",
  });
  const order = orderResult.isError ? undefined : orderResult.data;
  const version = order?.versions.find(({ id }) => id === versionId);
  if (!order || !version) return null;
  const ru = language === "ru";
  const versionLabel = ru
    ? `Версия ${version.number}`
    : `Version ${version.number}`;
  const invalidated = version.invalidatedByCartEdit;
  if (
    !invalidated &&
    order.acceptedVersionId &&
    order.acceptedVersionId !== versionId
  ) {
    return <span>{versionLabel}</span>;
  }
  return (
    <div className="grid justify-items-start gap-2">
      {version.previewMimeType && previewTypes.has(version.previewMimeType) && (
        <ImagePreview
          key={version.preview.id}
          subjectId={subjectId}
          orderId={order.orderId}
          fileId={version.preview.id}
          alt={
            ru
              ? `Превью версии ${version.number}`
              : `Version ${version.number} preview`
          }
        />
      )}
      {invalidated ? (
        <span>
          {ru
            ? `Версия ${version.number} относится к заказу до изменения количества.`
            : `Version ${version.number} is from before the quantity change.`}
        </span>
      ) : onReview ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => onReview(version.id)}
        >
          {ru
            ? `Открыть версию ${version.number}`
            : `Open version ${version.number}`}
        </Button>
      ) : (
        <span>{versionLabel}</span>
      )}
    </div>
  );
}
