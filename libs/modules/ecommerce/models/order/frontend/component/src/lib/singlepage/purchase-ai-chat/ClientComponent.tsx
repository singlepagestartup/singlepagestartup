"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo } from "react";
import { Component as OrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { Icon } from "@sps/ui-adapter";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import type { IComponentPropsExtended, IReceiptProps } from "./interface";

function Receipt({ file, language }: IReceiptProps) {
  const ru = language === "ru";
  const className =
    "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium";
  return file ? (
    <a
      className={className}
      download
      href={
        /^https?:\/\//.test(file.file)
          ? file.file
          : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`
      }
    >
      <Icon name="file-text" /> {ru ? "Чек" : "Receipt"}
    </a>
  ) : (
    <button
      type="button"
      disabled
      title={ru ? "Чек пока недоступен." : "Receipt is not available yet."}
      className={className}
    >
      <Icon name="file-text" /> {ru ? "Чек" : "Receipt"}
    </button>
  );
}

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
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
          {ru ? "Покупка услуги" : "Service purchase"}{" "}
          <span className="ml-2 inline-flex rounded-full bg-primary/25 px-2 py-1 text-xs font-medium">
            {props.data.status === "expired"
              ? ru
                ? "Срок истёк"
                : "Expired"
              : ru
                ? "Оплачено"
                : "Paid"}
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
            : props.totalsError || !currencies.size
              ? ru
                ? "Сумма недоступна"
                : "Total unavailable"
              : Array.from(currencies, ([id, value]) => (
                  <span key={id} className="block">
                    {value.amount.toLocaleString(language)} {value.label}
                  </span>
                ))}
        </span>
        {props.purchaseDetails || props.dataSource === "props" ? (
          <Receipt
            language={language}
            file={props.purchaseDetails?.receipts[0]}
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
              ) : (
                <Receipt language={language} />
              )
            }
          </OrdersToFileStorageModuleFiles>
        )}
      </div>
    </li>
  );
});
