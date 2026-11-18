import {
  serverHost,
  route,
  type IEcommerceCartSelectionInput,
  type IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  orderId: string;
  data: IEcommerceCartSelectionInput;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IEcommerceCartSelectionResult;

export async function action(props: IProps): Promise<IResult> {
  if (!props.id || !props.orderId) {
    throw new Error("Validation error. Subject and order IDs are required");
  }
  const requestOptions: NextRequestOptions = {
    ...props.options,
    credentials: "include",
    method: "POST",
    cache: "no-store",
    next: { ...props.options?.next, revalidate: 0 },
    body: prepareFormDataToSend({ data: props.data }),
  };
  const response = await fetch(
    `${props.host ?? serverHost}${route}/${encodeURIComponent(props.id)}/ecommerce-module/orders/${encodeURIComponent(props.orderId)}/selection`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res: response });
  return transformResponseItem<IResult>(json);
}
