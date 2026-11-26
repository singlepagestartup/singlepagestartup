"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IOrderArtifact,
  IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { Button, Textarea } from "@sps/shared-ui-shadcn";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { FilePreview } from "@sps/ui-adapter";

import type { IOrderFileReview } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";

interface IProps {
  prompt?: IOrderFileReview;
  subjectId: string;
  work: IOrderWorkView;
  language: string;
  storeTest?: boolean;
  checkoutHref?: string;
  onReadArtifact?: (id: string) => Promise<Blob>;
}

export async function downloadOrderArtifact(
  subjectId: string,
  orderId: string,
  artifactId: string,
  filename: string,
) {
  const blob = await api.orderWork.content({
    id: subjectId,
    orderId,
    artifactId,
  });
  saveOrderArtifact(blob, filename);
}

function saveOrderArtifact(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const extension =
    {
      "application/pdf": ".pdf",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
    }[blob.type] ?? "";
  a.download = filename + extension;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResultReview(props: IProps) {
  return props.onReadArtifact ? (
    <ResultReviewContent {...props} />
  ) : (
    <BuyerResultReview {...props} />
  );
}

function BuyerResultReview(props: IProps) {
  const decision = api.orderWork.decision();
  return <ResultReviewContent {...props} decision={decision} />;
}

interface IResultReviewContentProps extends IProps {
  decision?: ReturnType<typeof api.orderWork.decision>;
}

function ResultReviewContent({
  subjectId,
  work,
  language,
  storeTest,
  checkoutHref,
  prompt,
  onReadArtifact,
  decision,
}: IResultReviewContentProps) {
  const ru = language === "ru";
  const [reason, setReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");
  const intent = useRef<{ signature: string; key: string } | undefined>(
    undefined,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const settledId = work.paidFileId ?? work.acceptedFileId;
  const file = settledId
    ? work.files?.find((entry) => entry.id === settledId)
    : work.files?.at(-1);
  const currentFile = file?.invalidatedByCartEdit ? undefined : file;
  const includedInWork = currentFile?.includedInWork ?? work.includedInWork;
  const textDraft = currentFile?.previewMimeType === "text/plain";
  const draftId = currentFile?.preview?.id;
  const readDraft = useCallback(
    (signal?: AbortSignal, maxBytes?: number) => {
      if (!draftId) {
        return Promise.reject(new Error("Draft unavailable"));
      }
      return onReadArtifact
        ? onReadArtifact(draftId)
        : api.orderWork.content({
            id: subjectId,
            orderId: work.orderId,
            artifactId: draftId,
            options: { signal },
            maxBytes,
          });
    },
    [draftId, onReadArtifact, subjectId, work.orderId],
  );
  const canCheckout =
    !includedInWork &&
    !onReadArtifact &&
    checkoutHref &&
    !storeTest &&
    work.state === "awaiting-payment" &&
    !work.paidFileId &&
    Boolean(work.acceptedFileId && work.acceptedFileId === currentFile?.id);
  const currencies = currencyApi.find({
    params: {
      filters: {
        and: [
          { column: "id", method: "eq", value: currentFile?.currencyId ?? "" },
        ],
      },
    },
    reactQueryOptions: {
      enabled: !includedInWork && Boolean(currentFile?.currencyId),
    },
  });
  const currency = currencies.data?.[0];
  const choosing =
    !onReadArtifact &&
    work.state === "awaiting-result" &&
    !work.acceptedFileId &&
    !currentFile?.changesRequested;
  const awaitingBriefRevision =
    includedInWork &&
    work.state === "awaiting-result" &&
    !work.acceptedFileId &&
    currentFile?.changesRequested;
  const shippingStatus =
    !storeTest && !work.paidFileId && (work.files?.length ?? 0) === 0
      ? {
          "awaiting-payment": ru ? "Ожидает оплаты" : "Awaiting payment",
          paid: ru ? "Оплачен" : "Paid",
          preparing: ru ? "Собирается" : "Being packed",
          "in-transit": ru ? "В пути" : "In transit",
          delivered: ru ? "Вручён" : "Delivered",
          "awaiting-result": undefined,
          canceled: undefined,
        }[work.state]
      : undefined;

  async function download(artifact: IOrderArtifact, filename: string) {
    setError("");
    setDownloadingId(artifact.id);
    try {
      if (onReadArtifact) {
        const blob = await onReadArtifact(artifact.id);
        saveOrderArtifact(blob, filename);
      } else {
        await downloadOrderArtifact(
          subjectId,
          work.orderId,
          artifact.id,
          filename,
        );
      }
    } catch {
      setError(ru ? "Не удалось открыть файл." : "Could not open the file.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function choose(operation: "accept" | "decline") {
    if (!choosing || !currentFile || !decision || decision.isPending) return;
    const signature = `${operation}:${currentFile.id}:${reason.trim()}`;
    if (intent.current?.signature !== signature) {
      intent.current = { signature, key: crypto.randomUUID() };
    }
    const input = {
      storeId: work.storeId,
      taskId: work.taskId,
      fileId: currentFile.id,
      operationKey: intent.current.key,
    };
    setError("");
    try {
      await decision.mutateAsync({
        id: subjectId,
        orderId: work.orderId,
        data:
          operation === "accept"
            ? { ...input, operation }
            : { ...input, operation, reason: reason.trim() },
      });
      if (
        operation === "accept" &&
        !includedInWork &&
        !storeTest &&
        checkoutHref
      )
        window.location.assign(checkoutHref);
      setDeclining(false);
      setReason("");
      intent.current = undefined;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : ru
            ? "Не удалось сохранить решение."
            : "Could not save the decision.",
      );
    }
  }

  if (
    prompt &&
    (prompt.fileId !== currentFile?.id || (!choosing && !awaitingBriefRevision))
  ) {
    return null;
  }
  return (
    <section
      className={
        prompt
          ? "mt-2 grid gap-2"
          : "grid gap-3 rounded-xl border border-border bg-card p-4"
      }
      aria-label={ru ? "Результат работы" : "Order result"}
    >
      {currentFile && !work.acceptedFileId && (
        <>
          {!prompt && textDraft && (
            <FilePreview
              language={language}
              layout="row"
              name={ru ? "Черновик брифа.txt" : "Brief draft.txt"}
              mimeType={currentFile.previewMimeType}
              onDownload={readDraft}
            />
          )}
          {!prompt && !textDraft && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 justify-self-start"
              disabled={downloadingId !== null}
              onClick={() =>
                void download(currentFile.preview, `preview-${currentFile.id}`)
              }
            >
              {ru ? "Скачать превью" : "Download preview"}
            </Button>
          )}
          {!includedInWork &&
            (currency ? (
              <p className="text-sm">
                {ru ? "Цена" : "Price"} ·{" "}
                {formatCurrencyAmount(currentFile.price, language)}{" "}
                {currency.symbol || currency.title}
              </p>
            ) : (
              <p role="status" className="text-sm text-muted-foreground">
                {currencies.isPending
                  ? ru
                    ? "Загружаем цену…"
                    : "Loading the price…"
                  : ru
                    ? "Не удалось загрузить валюту цены."
                    : "The price currency could not be loaded."}
              </p>
            ))}
          {choosing && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                className="min-h-11"
                disabled={decision?.isPending || (!includedInWork && !currency)}
                onClick={() => void choose("accept")}
              >
                {includedInWork
                  ? ru
                    ? "Принять бриф и получить PDF"
                    : "Approve brief and get PDF"
                  : (prompt?.acceptText ??
                    (ru
                      ? checkoutHref && !storeTest
                        ? "Принять файл и перейти к оплате"
                        : "Принять файл"
                      : checkoutHref && !storeTest
                        ? "Accept file and continue to payment"
                        : "Accept file"))}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={decision?.isPending}
                onClick={() => setDeclining((open) => !open)}
              >
                {prompt?.declineText ??
                  (ru ? "Запросить правки" : "Request changes")}
              </Button>
            </div>
          )}
          {choosing && declining && (
            <label className="grid gap-2 text-sm font-medium">
              {ru ? "Что нужно исправить?" : "What should change?"}
              <Textarea
                value={reason}
                maxLength={4000}
                rows={2}
                onChange={(event) => setReason(event.currentTarget.value)}
                className="rounded-lg border border-input bg-background p-3"
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11 justify-self-start"
                disabled={!reason.trim() || decision?.isPending}
                onClick={() => void choose("decline")}
              >
                {ru ? "Отправить правки" : "Send feedback"}
              </Button>
            </label>
          )}
        </>
      )}
      {!onReadArtifact && work.state === "awaiting-result" && !currentFile && (
        <p role="status" className="text-sm text-muted-foreground">
          {storeTest
            ? ru
              ? "Здесь появится результат теста."
              : "The test result will appear here."
            : ru
              ? includedInWork
                ? "Черновик появится в чате, когда будет готов."
                : "Превью и цена появятся, когда файл будет готов."
              : includedInWork
                ? "The draft will appear in chat when it’s ready."
                : "The preview and price will appear when the file is ready."}
        </p>
      )}
      {currentFile?.changesRequested && !work.acceptedFileId && (
        <p role="status">{ru ? "Правки запрошены." : "Changes requested."}</p>
      )}
      {work.state === "canceled" && (
        <p role="status">{ru ? "Заказ отменён." : "Order canceled."}</p>
      )}
      {!includedInWork && work.paidFileId && work.state !== "canceled" && (
        <p role="status" className="text-sm font-medium">
          {work.deliveryStatus === "pending"
            ? ru
              ? "Оплата подтверждена. Ожидаем файл от исполнителя."
              : "Payment confirmed. Waiting for the file from the assigned employee."
            : ru
              ? "Оплачено"
              : "Paid"}
        </p>
      )}
      {includedInWork && work.result && (
        <p role="status" className="text-sm font-medium">
          {ru ? "Бриф принят" : "Brief approved"}
        </p>
      )}
      {!includedInWork &&
        !onReadArtifact &&
        work.state !== "canceled" &&
        !work.paidFileId &&
        work.acceptedFileId &&
        currentFile && (
          <p role="status" className="text-sm font-medium">
            {ru ? "Файл принят" : "File accepted"}
            {" · "}
            {formatCurrencyAmount(currentFile.price, language)}{" "}
            {currency?.symbol}
          </p>
        )}
      {canCheckout && (
        <Button
          asChild
          variant="primary"
          className="min-h-11 justify-self-start"
        >
          <Link href={checkoutHref}>
            {ru ? "Перейти к оплате" : "Continue to payment"}
          </Link>
        </Button>
      )}
      {shippingStatus && (
        <p role="status" className="text-sm font-medium">
          {shippingStatus}
        </p>
      )}
      {work.trackingNumber && (
        <p className="text-sm">
          {ru ? "Номер отслеживания" : "Tracking number"} ·{" "}
          {work.trackingNumber}
        </p>
      )}
      {work.expertArchive && work.expertArchive.length > 0 && (
        <section
          aria-label={
            ru
              ? "Характеристики на момент покупки"
              : "Specifications at purchase"
          }
          className="grid gap-2"
        >
          <h3 className="text-sm font-semibold">
            {ru
              ? "Характеристики на момент покупки"
              : "Specifications at purchase"}
          </h3>
          {work.expertArchive.map(
            ({ sourceId, versionDigest, title, content }) => (
              <details
                key={sourceId}
                className="rounded-lg border border-border px-3"
              >
                <summary className="flex min-h-11 cursor-pointer items-center break-words text-sm font-medium">
                  {title}
                </summary>
                <p className="whitespace-pre-wrap break-words pb-3 text-sm">
                  {content}
                </p>
                <dl className="grid gap-1 border-t border-border py-2 text-xs text-muted-foreground">
                  <dt>{ru ? "ID источника" : "Source ID"}</dt>
                  <dd className="break-all font-mono">{sourceId}</dd>
                  <dt>{ru ? "Хеш версии" : "Version hash"}</dt>
                  <dd className="break-all font-mono">{versionDigest}</dd>
                </dl>
              </details>
            ),
          )}
        </section>
      )}
      {work.result && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 justify-self-start"
          disabled={downloadingId !== null}
          onClick={() =>
            void download(
              work.result!,
              includedInWork ? "business-brief" : `order-${work.orderId}`,
            )
          }
        >
          {includedInWork
            ? ru
              ? "Скачать итоговый PDF"
              : "Download final PDF"
            : ru
              ? "Скачать оригинал"
              : "Download original"}
        </Button>
      )}
      {work.receipt && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 justify-self-start"
          disabled={downloadingId !== null}
          onClick={() =>
            void download(work.receipt!, `receipt-${work.orderId}`)
          }
        >
          {ru ? "Скачать чек" : "Download receipt"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
