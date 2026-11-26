import { FilePreview } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useCallback } from "react";
import Link from "next/link";
import type { ICrmOrderContents } from "@sps/rbac/models/subject/sdk/model";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { storeProductHref } from "../../paths";
import { localizedText } from "../../products/view-model";

interface IProps {
  order: ICrmOrderContents;
  language: string;
  storeSlug: string;
  subjectId: string;
  storeId: string;
  orderId: string;
}

const statusLabels: Record<string, [string, string]> = {
  draft: ["Черновик", "Draft"],
  open: ["Выставлен", "Open"],
  paid: ["Оплачен", "Paid"],
  uncollectible: ["Не подлежит взысканию", "Uncollectible"],
  void: ["Аннулирован", "Void"],
  processing: ["В обработке", "Processing"],
  requires_action: ["Требуется действие", "Action required"],
  requires_capture: ["Ожидает списания", "Awaiting capture"],
  requires_confirmation: ["Ожидает подтверждения", "Awaiting confirmation"],
  requires_payment_method: [
    "Ожидает способа оплаты",
    "Awaiting payment method",
  ],
  succeeded: ["Подтверждён", "Succeeded"],
  failed: ["Ошибка оплаты", "Failed"],
  canceled: ["Отменён", "Canceled"],
  requires_reconciliation: ["Требует сверки", "Requires reconciliation"],
};

function OrderAttachment({
  file,
  language,
  subjectId,
  storeId,
  orderId,
}: Pick<IProps, "language" | "subjectId" | "storeId" | "orderId"> & {
  file: NonNullable<ICrmOrderContents["resultFiles"]>[number];
}) {
  const download = useCallback(
    (signal?: AbortSignal, maxBytes?: number) =>
      api.orderWork.content({
        id: subjectId,
        orderId,
        storeId,
        artifactId: file.id,
        options: { signal },
        maxBytes,
      }),
    [subjectId, storeId, orderId, file.id],
  );
  const ru = language === "ru";
  const label = file.original
    ? ru
      ? "Оригинал"
      : "Original"
    : ru
      ? "Предпросмотр"
      : "Preview";
  const stamp = new Intl.DateTimeFormat(language, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(file.createdAt));
  const extension = (
    {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "application/pdf": "pdf",
    } as Record<string, string>
  )[file.mime ?? ""];
  const name = file.name || (extension ? `${label}.${extension}` : label);
  return (
    <div className="grid gap-1">
      <FilePreview
        language={language}
        name={name}
        mimeType={file.mime}
        layout="gallery"
        onDownload={download}
      />
      <time dateTime={file.createdAt} className="text-xs text-muted-foreground">
        {stamp}
      </time>
    </div>
  );
}

export function OrderContents({
  order,
  language,
  storeSlug,
  subjectId,
  storeId,
  orderId,
}: IProps) {
  const ru = language === "ru";
  const status = (value: string) => statusLabels[value]?.[ru ? 0 : 1] ?? value;
  return (
    <div className="grid gap-5 border-t border-border pt-4 text-sm">
      <section className="grid gap-2">
        <h2 className="text-base font-semibold">
          {ru ? "Состав заказа" : "Order items"}
        </h2>
        {order.lines?.length ? (
          <ul className="divide-y divide-border">
            {order.lines.map(
              ({ id, productId, title, name, quantity, destination }) => (
                <li key={id} className="grid gap-1 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      className="font-medium underline underline-offset-4"
                      href={storeProductHref(language, storeSlug, productId)}
                    >
                      {localizedText(title, language) || name}
                    </Link>
                    <span>
                      {ru ? "Количество" : "Quantity"} · {quantity}
                    </span>
                  </div>
                  {(destination.region || destination.address) && (
                    <p>
                      {ru ? "Доставка" : "Delivery"} ·{" "}
                      {[destination.region, destination.address]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {destination.pickupPointId && (
                    <p>
                      {ru ? "Пункт выдачи" : "Pickup point"} ·{" "}
                      {destination.pickupPointId}
                    </p>
                  )}
                  {destination.coordinates && (
                    <p>
                      {ru ? "Координаты" : "Coordinates"} ·{" "}
                      {destination.coordinates.latitude},{" "}
                      {destination.coordinates.longitude}
                    </p>
                  )}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {ru
              ? "В заказе нет позиций этого магазина."
              : "No items from this store."}
          </p>
        )}
        {order.trackingNumber && (
          <p>
            {ru ? "Трек-номер" : "Tracking number"} · {order.trackingNumber}
          </p>
        )}
        {order.comment && (
          <p className="whitespace-pre-wrap break-words">
            {ru ? "Комментарий к заказу" : "Order comment"} · {order.comment}
          </p>
        )}
      </section>
      {Boolean(order.resultFiles?.length) && (
        <section className="grid gap-3 border-t border-border pt-4">
          <h2 className="text-base font-semibold">
            {ru ? "Файлы заказа" : "Order files"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.resultFiles?.map((file) => (
              <li key={file.id}>
                <OrderAttachment
                  file={file}
                  language={language}
                  subjectId={subjectId}
                  storeId={storeId}
                  orderId={orderId}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {order.payments && (
        <section className="grid gap-2 border-t border-border pt-4">
          <h2 className="text-base font-semibold">
            {ru ? "Оплата" : "Payment"}
          </h2>
          {order.payments.length ? (
            order.payments.map((payment) => {
              const amount = (value: number | null) =>
                value === null
                  ? ru
                    ? "Сумма не определена"
                    : "Amount unavailable"
                  : [formatCurrencyAmount(value, language), payment.currency]
                      .filter(Boolean)
                      .join(" ");
              return (
                <div
                  key={payment.id}
                  className="grid gap-1 break-words rounded-xl border border-border p-3"
                >
                  <p className="font-semibold">
                    {ru ? "Платёж" : "Payment"} {payment.id} ·{" "}
                    {status(payment.status)}
                  </p>
                  <p>
                    {ru ? "Сумма платежа" : "Payment amount"} ·{" "}
                    {amount(payment.amount)}
                  </p>
                  <p>
                    {ru ? "Оплачено" : "Paid"} · {amount(payment.paid)}
                  </p>
                  {payment.invoices.map((invoice) => (
                    <p key={invoice.id}>
                      {ru ? "Счёт" : "Invoice"} {invoice.id} ·{" "}
                      {status(invoice.status)}
                    </p>
                  ))}
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">
              {ru
                ? "Для заказа пока нет платежей."
                : "No payments recorded for this order."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
