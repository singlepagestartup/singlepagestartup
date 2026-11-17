"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo } from "react";
import { Component as OrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { Icon } from "@sps/ui-adapter";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import type { IComponentPropsExtended, IReceiptProps } from "./interface";

const statuses: Record<string, { ru: string; en: string; color: string }> = {
  new: {
    ru: "Новый",
    en: "New",
    color: "bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-200",
  },
  paying: {
    ru: "Ожидает оплаты",
    en: "Awaiting payment",
    color: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  failed: {
    ru: "Ошибка оплаты",
    en: "Payment failed",
    color: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
  canceling: {
    ru: "Отменяется",
    en: "Canceling",
    color: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  },
  requested_cancelation: {
    ru: "Запрошена отмена",
    en: "Cancellation requested",
    color:
      "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  },
  canceled: {
    ru: "Отменён",
    en: "Canceled",
    color: "bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-200",
  },
  expired: {
    ru: "Срок истёк",
    en: "Expired",
    color: "bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-200",
  },
  paid: {
    ru: "Оплачено",
    en: "Paid",
    color: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  },
  approving: {
    ru: "На подтверждении",
    en: "Awaiting approval",
    color:
      "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  },
  packaging: {
    ru: "Собирается",
    en: "Packaging",
    color:
      "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  },
  delivering: {
    ru: "В пути",
    en: "Delivering",
    color: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  delivered: {
    ru: "Доставлен",
    en: "Delivered",
    color: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  },
  completed: {
    ru: "Завершён",
    en: "Completed",
    color:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
};

function Receipt({ file, language }: IReceiptProps) {
  const path = file?.file?.trim();
  if (!path) return null;
  const external = /^https?:\/\//i.test(path);
  if (!external && (!path.startsWith("/") || path.startsWith("//")))
    return null;
  const href = external
    ? path
    : `${NEXT_PUBLIC_API_SERVICE_URL}${path.startsWith("/public/") ? "" : "/public"}${path}`;
  return (
    <a
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="file-text" /> {language === "ru" ? "Чек" : "Receipt"}
    </a>
  );
}

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const savedCharges = props.purchaseDetails?.charges ?? [];
  const primaryCharge = savedCharges.find(
    (snapshot) => snapshot.charge.role === "product",
  );
  const invoiceShares = props.purchaseDetails?.invoiceShares ?? [];
  const legacyShared = invoiceShares.some(
    (share) => share.amount === null && !share.showSharedTotal,
  );
  const status = props.purchaseDetails?.requiresReconciliation
    ? {
        ru: "Платёж на проверке",
        en: "Payment under review",
        color: "bg-muted text-foreground",
      }
    : statuses[
        props.data.status === "cancelled" ? "canceled" : props.data.status
      ];
  const paymentUrl =
    props.data.status === "paying" &&
    !props.purchaseDetails?.requiresReconciliation
      ? props.purchaseDetails?.paymentUrl
      : undefined;
  const currencies = new Map<string, { amount: number; label: string }>();
  props.totals?.forEach(({ total, billingModuleCurrency }) => {
    const previous = currencies.get(billingModuleCurrency.id);
    currencies.set(billingModuleCurrency.id, {
      amount: (previous?.amount ?? 0) + total,
      label: /^[a-z]{3}$/i.test(billingModuleCurrency.slug)
        ? billingModuleCurrency.slug.toUpperCase()
        : billingModuleCurrency.symbol,
    });
  });
  const date = new Date(props.data.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
  return (
    <li
      className="grid min-w-0 gap-3 border-t border-border py-4 @[640px]:grid-cols-[minmax(0,1fr)_auto] @[640px]:items-center"
      data-module="ecommerce"
      data-model="order"
      data-variant={props.variant}
      data-id={props.data.id}
    >
      <div>
        <p className="text-sm font-semibold">
          {primaryCharge?.charge.title ??
            (ru ? "Покупка услуги" : "Service purchase")}{" "}
          <span
            className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${status?.color ?? "bg-muted text-muted-foreground"}`}
          >
            {status?.[ru ? "ru" : "en"] ?? props.data.status}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {props.data.receipt || props.data.id} · {dateLabel}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold">
          {props.totalsPending
            ? ru
              ? "Загрузка суммы…"
              : "Loading total…"
            : legacyShared
              ? ru
                ? "В общем счёте"
                : "Included in shared invoice"
              : props.totalsError || !currencies.size
                ? ru
                  ? "Сумма недоступна"
                  : "Total unavailable"
                : Array.from(currencies, ([id, value]) => (
                    <span key={id} className="block">
                      {value.amount.toLocaleString(language, {
                        maximumFractionDigits: 8,
                      })}{" "}
                      {value.label}
                    </span>
                  ))}
        </span>
        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {ru ? "Перейти к оплате" : "Continue to payment"}
          </a>
        )}
        {props.purchaseDetails || props.dataSource === "props" ? (
          <Receipt
            language={language}
            file={props.purchaseDetails?.receipts.find((receipt) =>
              receipt.file?.trim(),
            )}
          />
        ) : (
          <OrdersToFileStorageModuleFiles
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "orderId", method: "eq", value: props.data.id },
                    {
                      column: "variant",
                      method: "eq",
                      value: "receipt-default",
                    },
                  ],
                },
              },
            }}
          >
            {({ data: ordersToFileStorageModuleFiles }) =>
              ordersToFileStorageModuleFiles?.length ? (
                <FileStorageModuleFile
                  isServer={false}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "id",
                            method: "eq",
                            value:
                              ordersToFileStorageModuleFiles[0]
                                .fileStorageModuleFileId,
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: fileStorageModuleFiles }) => (
                    <Receipt
                      language={language}
                      file={fileStorageModuleFiles?.[0]}
                    />
                  )}
                </FileStorageModuleFile>
              ) : null
            }
          </OrdersToFileStorageModuleFiles>
        )}
        {props.actions}
      </div>
      {invoiceShares.length > 0 ? (
        <div className="space-y-1 text-xs text-muted-foreground @[640px]:col-span-2">
          {invoiceShares.map((share) => (
            <p key={share.invoiceId} className="break-words">
              {ru ? "Счёт" : "Invoice"} {share.invoiceId}
              {share.orderIds.length > 1
                ? ` · ${ru ? "Общий для заказов" : "Shared by orders"}: ${share.orderIds.join(", ")}`
                : ""}
              {share.amount === null
                ? ` · ${ru ? "Доли заказов не сохранены" : "Individual shares were not saved"}`
                : ""}
            </p>
          ))}
        </div>
      ) : null}
      {savedCharges.length > 0 ? (
        <details className="group min-w-0 rounded-xl border border-border p-4 @[640px]:col-span-2">
          <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
            {ru ? "Товар и услуги" : "Item and services"}
          </summary>
          {primaryCharge?.destination.address ||
          primaryCharge?.destination.pickupPointId ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {primaryCharge.destination.address ??
                `${ru ? "Самовывоз" : "Pickup"}: ${primaryCharge.destination.pickupPointId}`}
            </p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {savedCharges.map((snapshot) => (
              <li
                key={`${snapshot.charge.offerId}:${snapshot.parentLineId ?? "primary"}`}
                className={`flex justify-between gap-4 text-sm ${snapshot.charge.role === "product" ? "font-medium" : "ml-4 border-l border-border pl-4"}`}
              >
                <div>
                  <p>
                    {snapshot.charge.title ??
                      (snapshot.charge.role === "product"
                        ? ru
                          ? "Товар"
                          : "Item"
                        : ru
                          ? "Услуга"
                          : "Service")}{" "}
                    × {snapshot.charge.quantity}
                  </p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {snapshot.charge.storeTitle}
                    {snapshot.charge.providerStoreId !== snapshot.charge.storeId
                      ? ` · ${ru ? "Исполнитель" : "Fulfilled by"}: ${snapshot.charge.providerStoreTitle ?? snapshot.charge.providerStoreId}`
                      : ""}
                    {snapshot.purchaseType === "subscription"
                      ? ` · ${snapshot.charge.recurrence === "first" ? (ru ? "Только первая поставка" : "First delivery only") : ru ? "Каждая поставка" : "Every delivery"}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {Number(snapshot.amount).toLocaleString(language, {
                    maximumFractionDigits: 8,
                  })}{" "}
                  {currencies.get(snapshot.currencyId)?.label ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {props.footer && (
        <div className="@[640px]:col-span-2">{props.footer}</div>
      )}
    </li>
  );
});
