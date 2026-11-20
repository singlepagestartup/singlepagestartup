"use client";

import { useRef, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IOrderArtifact,
  IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";

interface IProps {
  subjectId: string;
  work: IOrderWorkView;
  language: string;
  storeTest?: boolean;
  selectedVersionId?: string;
  onVersionSelect?: (id: string) => void;
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

export function ResultReview({
  subjectId,
  work,
  language,
  storeTest,
  selectedVersionId,
  onVersionSelect,
}: IProps) {
  const ru = language === "ru";
  const [selection, setSelection] = useState("");
  const [reason, setReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState("");
  const intent = useRef<{ signature: string; key: string } | undefined>(
    undefined,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const decision = api.orderWork.decision();
  const availableVersions = work.versions.filter(
    (version) => !version.invalidatedByCartEdit,
  );
  const version =
    availableVersions.find(
      ({ id }) =>
        id ===
        (work.paidVersionId ??
          work.acceptedVersionId ??
          selectedVersionId ??
          selection),
    ) ?? availableVersions.at(-1);
  const currencies = currencyApi.find({
    params: {
      filters: {
        and: [{ column: "id", method: "eq", value: version?.currencyId ?? "" }],
      },
    },
    reactQueryOptions: { enabled: Boolean(version?.currencyId) },
  });
  const currency = currencies.data?.[0];
  const versionLabel = (number: number) =>
    ru ? `Версия ${number}` : `Version ${number}`;
  const choosing = work.state === "awaiting-result" && !work.acceptedVersionId;
  const shippingStatus =
    !storeTest && work.versions.length === 0
      ? {
          "awaiting-payment": ru ? "Ожидает оплаты" : "Awaiting payment",
          paid: ru ? "Оплачен" : "Paid",
          preparing: ru ? "Собирается" : "Being packed",
          "in-transit": ru ? "В пути" : "In transit",
          delivered: ru ? "Вручён" : "Delivered",
          "awaiting-result": undefined,
        }[work.state]
      : undefined;

  async function download(artifact: IOrderArtifact, filename: string) {
    setError("");
    setDownloadingId(artifact.id);
    try {
      await downloadOrderArtifact(
        subjectId,
        work.orderId,
        artifact.id,
        filename,
      );
    } catch {
      setError(ru ? "Не удалось открыть файл." : "Could not open the file.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function choose(operation: "accept" | "decline") {
    if (!choosing || !version || decision.isPending) return;
    const signature = `${operation}:${version.id}:${reason.trim()}`;
    if (intent.current?.signature !== signature) {
      intent.current = { signature, key: crypto.randomUUID() };
    }
    const input = {
      storeId: work.storeId,
      taskId: work.taskId,
      resultVersionId: version.id,
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
      setDeclining(false);
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

  return (
    <section
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
      aria-label={ru ? "Результат работы" : "Order result"}
    >
      {choosing && version && (
        <>
          <label className="grid gap-1 text-sm font-medium">
            {ru ? "Версия результата" : "Result version"}
            <Select
              ui="shadcn"
              aria-label={ru ? "Версия результата" : "Result version"}
              value={version.id}
              onValueChange={onVersionSelect ?? setSelection}
              className="min-h-11 w-full"
              options={availableVersions.map(({ id, number }) => ({
                value: id,
                label: versionLabel(number),
              }))}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 justify-self-start"
            disabled={downloadingId !== null}
            onClick={() =>
              void download(version.preview, `preview-${version.number}`)
            }
          >
            {ru ? "Скачать превью" : "Download preview"}
          </Button>
          {currency ? (
            <p className="text-sm">
              {ru ? "Цена этой версии" : "Price for this version"} ·{" "}
              {formatCurrencyAmount(version.price, language)}{" "}
              {currency.symbol || currency.title}
            </p>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {currencies.isPending
                ? ru
                  ? "Загружаем цену версии…"
                  : "Loading the version price…"
                : ru
                  ? "Не удалось загрузить валюту цены."
                  : "The price currency could not be loaded."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              disabled={decision.isPending || !currency}
              onClick={() => void choose("accept")}
            >
              {ru
                ? `Принять версию ${version.number}`
                : `Accept version ${version.number}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={decision.isPending}
              onClick={() => setDeclining((open) => !open)}
            >
              {ru ? "Отказаться" : "Decline"}
            </Button>
          </div>
          {declining && (
            <label className="grid gap-2 text-sm font-medium">
              {ru ? "Причина отказа" : "Reason for declining"}
              <textarea
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
                disabled={!reason.trim() || decision.isPending}
                onClick={() => void choose("decline")}
              >
                {ru ? "Подтвердить отказ" : "Confirm decline"}
              </Button>
            </label>
          )}
        </>
      )}
      {work.state === "awaiting-result" && !version && (
        <p role="status" className="text-sm text-muted-foreground">
          {storeTest
            ? ru
              ? "Здесь появится результат теста."
              : "The test result will appear here."
            : ru
              ? "Цена появится вместе с превью. Оплата откроется после принятия версии."
              : "The preview includes its price. You can pay after accepting a version."}
        </p>
      )}
      {work.acceptedVersionId && version && (
        <p role="status" className="text-sm font-medium">
          {ru
            ? `Принята версия ${version.number}`
            : `Version ${version.number} accepted`}
          {" · "}
          {formatCurrencyAmount(version.price, language)} {currency?.symbol}
        </p>
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
              `order-${work.orderId}-v${version?.number}`,
            )
          }
        >
          {ru ? "Скачать оригинал" : "Download original"}
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
