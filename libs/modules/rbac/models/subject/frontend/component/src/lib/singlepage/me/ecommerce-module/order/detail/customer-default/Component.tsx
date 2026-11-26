import { OrderCheckoutDetails } from "./OrderCheckoutDetails";
import { OrderResultKnowledge } from "./OrderResultKnowledge";
import { OrderCard } from "../../OrderCard";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const order = props.ecommerceModuleOrder;
  const discussion = order?.customerDetails?.discussion;
  const result = order?.customerDetails?.deliveredResult;
  return (
    <div
      className="grid min-w-0 gap-5"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
    >
      {order ? (
        <>
          <OrderCard ecommerceModuleOrder={order} language={props.language}>
            <OrderCheckoutDetails
              order={order}
              subjectId={props.subjectId}
              language={props.language}
            />
            {result && (
              <OrderResultKnowledge
                key={result.id}
                subjectId={props.subjectId}
                orderId={order.id}
                result={result}
                language={props.language}
              />
            )}
          </OrderCard>
          {discussion ? (
            props.renderDiscussion(discussion)
          ) : (
            <p className="text-sm text-muted-foreground">
              {ru
                ? "У этого заказа нет переписки."
                : "There is no discussion for this order."}
            </p>
          )}
        </>
      ) : (
        <p role="status">{ru ? "Заказ недоступен." : "Order unavailable."}</p>
      )}
    </div>
  );
}
