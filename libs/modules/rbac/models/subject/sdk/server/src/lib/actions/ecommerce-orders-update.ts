import { host, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IActionProps {
  id: string;
  orderId?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: any;
}

export interface IExtendedModel extends IModel {}

export async function action(props: IActionProps): Promise<IExtendedModel> {
  const { id, params, data, options } = props;
  const orderId = props.orderId || props.data["orderId"];

  if (!orderId) {
    throw new Error("orderId is required");
  }

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/ecommerce/orders/${orderId}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IExtendedModel }>({
    res,
  });

  const transformedData = transformResponseItem<IExtendedModel>(json);

  return transformedData;
}
