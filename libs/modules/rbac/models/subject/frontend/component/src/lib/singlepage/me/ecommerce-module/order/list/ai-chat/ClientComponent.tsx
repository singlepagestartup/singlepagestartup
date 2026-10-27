"use client";
import { internationalization } from "@sps/shared-configuration";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const orders = subjectApi.ecommerceModuleOrderList({
    id: props.data.id,
    params: {
      includePurchaseDetails: true,
      filters: {
        and: [
          { column: "type", method: "eq", value: "history" },
          {
            column: "status",
            method: "inArray",
            value: [
              "paid",
              "approving",
              "packaging",
              "delivering",
              "delivered",
              "expired",
              "completed",
            ],
          },
        ],
      },
    },
  });
  return (
    <section
      className="@container min-w-0 rounded-2xl border border-border bg-card p-5 @[640px]:p-6"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      aria-label={ru ? "Покупки" : "Purchases"}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <Icon name="wallet" />
            </span>

            {ru ? "Покупки" : "Purchases"}
          </h2>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">
            <p>
              {ru
                ? "Посмотрите свои покупки и чеки."
                : "View purchases and receipts."}
            </p>
          </div>
        </div>
      </header>
      {orders.isPending ? (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {ru ? "Загрузка покупок…" : "Loading purchases…"}
        </p>
      ) : orders.isError ? (
        <div role="alert" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          <p>
            {ru
              ? "Не удалось загрузить покупки."
              : "Purchases could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void orders.refetch()}
            className="mt-3 min-h-11 rounded-xl border border-border bg-card px-4 font-medium"
          >
            {ru ? "Повторить" : "Try again"}
          </button>
        </div>
      ) : orders.data?.length ? (
        <ul
          aria-label={ru ? "Оплаченные покупки" : "Paid purchases"}
          className="mt-5"
        >
          {[...orders.data]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((order) => (
              <EcommerceModuleOrder
                language={props.language}
                key={order.id}
                isServer={false}
                variant="purchase-ai-chat"
                data={order}
                dataSource="props"
                purchaseDetails={order.purchaseDetails}
              />
            ))}
        </ul>
      ) : (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {ru ? "Покупок пока нет." : "No purchases yet."}
        </p>
      )}
    </section>
  );
}
