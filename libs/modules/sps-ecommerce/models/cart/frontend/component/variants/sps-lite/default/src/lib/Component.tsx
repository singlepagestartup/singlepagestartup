import { IComponentPropsExtended } from "./interface";
import { Component as Order } from "@sps/sps-ecommerce-order-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="w-full flex flex-col gap-2 border border-gray-500 rounded-md p-2">
      <p className="text-2xl font-bold">Orders</p>
      {props.data.orders?.map((order, index) => {
        return (
          <Order key={index} isServer={false} variant="default" data={order} />
        );
      })}
    </div>
  );
}
