import { OrderCard } from "../../OrderCard";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const base = `/${props.language}/rbac/subjects/orders`;
  return (
    <div
      className="grid min-w-0 gap-5"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
    >
      {props.ecommerceModuleOrders.length ? (
        <ul className="grid gap-3">
          {props.ecommerceModuleOrders.map((order) => (
            <li key={order.id}>
              <OrderCard
                ecommerceModuleOrder={order}
                language={props.language}
                href={`${base}/${order.id}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">{ru ? "Заказов пока нет." : "No orders yet."}</p>
      )}
      {props.pagination}
    </div>
  );
}
