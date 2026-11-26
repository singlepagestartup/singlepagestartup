import type { IComponentProps } from "./interface";
import { OrderCard } from "../../OrderCard";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant="me-ecommerce-module-order-list-customer-default"
      className="grid min-w-0 gap-5"
    >
      {props.orders.length ? (
        <ul className="grid gap-3">
          {props.orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} href={props.detailHrefs[order.id]} />
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">Заказов пока нет.</p>
      )}
    </div>
  );
}
