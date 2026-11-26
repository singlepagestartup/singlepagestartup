import Link from "next/link";
import { OrderCard } from "../../OrderCard";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const base = `/${props.language}/rbac/subjects/orders`;
  const order = props.ecommerceModuleOrder;
  const discussion = order?.customerDetails?.discussion;
  return (
    <div
      className="grid min-w-0 gap-5"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
    >
      <Link
        href={base}
        className="w-fit text-sm font-medium underline underline-offset-4"
      >
        {ru ? "Все заказы" : "All orders"}
      </Link>
      {order ? (
        <>
          <OrderCard ecommerceModuleOrder={order} language={props.language} />
          <section className="grid min-w-0 gap-4">
            <header className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-xl font-semibold">
                {ru ? "Переписка по заказу" : "Order discussion"}
              </h3>
              {discussion && (
                <Link
                  className="text-sm font-medium underline underline-offset-4"
                  href={`/${props.language}/social/chats/${discussion.chatId}/threads/${discussion.threadId}`}
                >
                  {ru ? "Открыть в чатах" : "Open in chats"}
                </Link>
              )}
            </header>
            {discussion ? (
              props.renderDiscussion(discussion)
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru
                  ? "У этого заказа нет переписки."
                  : "There is no discussion for this order."}
              </p>
            )}
          </section>
        </>
      ) : (
        <p role="status">{ru ? "Заказ недоступен." : "Order unavailable."}</p>
      )}
    </div>
  );
}
