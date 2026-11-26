import type { IComponentProps } from "./interface";
import { OrderCard } from "../../OrderCard";
export function Component(props: IComponentProps) {
  const checkout = props.order?.checkout;
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant="me-ecommerce-module-order-detail-customer-default"
      className="grid min-w-0 gap-5"
    >
      {props.order ? (
        <>
          <OrderCard order={props.order}>
            {checkout && (
              <div className="mt-3 grid gap-4 border-t border-border pt-5">
                <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Сумма заказа", checkout.total],
                    ["Способ оплаты", checkout.paymentMethod],
                    ["Дата оплаты", checkout.paidAt],
                    ["Почта для чека", checkout.email],
                    ["Получение заказа", checkout.delivery],
                    ["Период подписки", checkout.subscriptionPeriod],
                    ["Комментарий к заказу", checkout.comment],
                  ].map(
                    ([label, value]) =>
                      value && (
                        <div
                          key={label}
                          className="grid min-w-0 content-start gap-1"
                        >
                          <dt className="text-sm text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="whitespace-pre-line break-words text-sm font-medium">
                            {value}
                          </dd>
                        </div>
                      ),
                  )}
                </dl>
                {checkout.downloadReceipt && (
                  <button
                    type="button"
                    className="min-h-10 w-fit rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                    onClick={checkout.downloadReceipt}
                  >
                    Скачать чек
                  </button>
                )}
              </div>
            )}
            {props.result && (
              <div className="mt-3 grid gap-3 border-t border-border pt-5">
                <p className="break-words text-sm font-medium">
                  {props.result.name}
                </p>
                <button
                  type="button"
                  className="min-h-10 w-fit rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                  onClick={props.result.onChange}
                >
                  {props.result.savedToKnowledge
                    ? "Удалить из знаний профиля"
                    : "Сохранить в знания"}
                </button>
                {props.result.savedToKnowledge && (
                  <p role="status" className="text-sm text-muted-foreground">
                    В знаниях вашего профиля
                  </p>
                )}
              </div>
            )}
          </OrderCard>
          {props.discussion ?? (
            <p className="text-sm text-muted-foreground">
              У этого заказа нет переписки.
            </p>
          )}
        </>
      ) : (
        <p role="status">Заказ недоступен.</p>
      )}
    </div>
  );
}
