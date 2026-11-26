import type { ReactNode } from "react";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { orderPaymentProviderLabel } from "@sps/rbac/models/subject/sdk/model";
import { ReceiptDownload } from "../../ReceiptDownload";
import type { IComponentPropsExtended } from "./interface";

interface IDetailsProps {
  order: NonNullable<IComponentPropsExtended["ecommerceModuleOrder"]>;
  language: string;
  subjectId: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line break-words text-sm font-medium">
        {children}
      </dd>
    </div>
  );
}

export function OrderCheckoutDetails({
  order,
  language,
  subjectId,
}: IDetailsProps) {
  const ru = language === "ru";
  const checkout = order.customerDetails?.checkout;
  const delivery = checkout?.delivery ?? [];
  const receipts = checkout?.receipts ?? [];
  const period = [
    order.subscriptionPeriodStartsAt,
    order.subscriptionPeriodEndsAt,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));
  const date = new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const hasDetails =
    checkout?.email ||
    checkout?.paymentProvider ||
    checkout?.paidAt ||
    checkout?.total ||
    delivery.length ||
    receipts.length ||
    order.receipt ||
    order.comment ||
    period.length;
  if (!hasDetails) return null;
  return (
    <div className="mt-3 grid gap-4 border-t border-border pt-5">
      <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {checkout?.total && (
          <Field label={ru ? "Сумма заказа" : "Order total"}>
            {`${formatCurrencyAmount(checkout.total.amount, language)} ${checkout.total.symbol}`}
          </Field>
        )}
        {checkout?.paymentProvider && (
          <Field label={ru ? "Способ оплаты" : "Payment method"}>
            {orderPaymentProviderLabel(checkout.paymentProvider, language)}
          </Field>
        )}
        {checkout?.paidAt && (
          <Field label={ru ? "Дата оплаты" : "Payment date"}>
            {date.format(new Date(checkout.paidAt))}
          </Field>
        )}
        {checkout?.email && (
          <Field label={ru ? "Почта для чека" : "Receipt email"}>
            {checkout.email}
          </Field>
        )}
        {delivery.map((item, index) => (
          <Field key={index} label={ru ? "Получение заказа" : "Delivery"}>
            {[
              item.kind === "digital"
                ? ru
                  ? "Файл в чате заказа"
                  : "File in the order chat"
                : item.method,
              item.region,
              item.address,
              item.pickupPointId &&
                `${ru ? "Пункт выдачи" : "Pickup point"} · ${item.pickupPointId}`,
              item.price &&
                `${formatCurrencyAmount(item.price.amount, language)} ${item.price.symbol}`,
            ]
              .filter(Boolean)
              .join("\n")}
          </Field>
        ))}
        {period.length > 0 && (
          <Field label={ru ? "Период подписки" : "Subscription period"}>
            {period.map((value) => date.format(new Date(value))).join(" — ")}
          </Field>
        )}
        {order.receipt && (
          <Field label={ru ? "Номер квитанции" : "Receipt reference"}>
            {order.receipt}
          </Field>
        )}
        {order.comment && (
          <Field label={ru ? "Комментарий к заказу" : "Order comment"}>
            {order.comment}
          </Field>
        )}
      </dl>
      {receipts.length > 0 && (
        <div className="flex flex-wrap items-start gap-2">
          {receipts.map((receipt) => (
            <ReceiptDownload
              key={receipt.id}
              receiptId={receipt.id}
              orderId={order.id}
              subjectId={subjectId}
              ru={ru}
            />
          ))}
        </div>
      )}
    </div>
  );
}
