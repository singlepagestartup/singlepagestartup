import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
export interface IProps {
  id: string;
  ecommerceModuleOrderId: string;
  data: { expectedUpdatedAt: string };
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IResult {
  accepted: boolean;
  order: IOrder;
}
export async function action(props: IProps): Promise<IResult> {
  const form = new FormData();
  form.set("data", JSON.stringify(props.data));
  const requestOptions: NextRequestOptions = {
    ...props.options,
    next: { ...props.options?.next },
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: form,
  };
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/ecommerce-module/orders/${props.ecommerceModuleOrderId}/subscription-period/freeze`,
    requestOptions,
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
