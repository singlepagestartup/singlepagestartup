import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  orderId: string;
  mode?: "next-period";
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export interface IResult {
  orderIds: string[];
}

export async function action(props: IProps): Promise<IResult> {
  const { id, orderId, options, host = serverHost } = props;

  if (!id) {
    throw new Error("Validation error. id is required");
  }
  if (!orderId) {
    throw new Error("Validation error. orderId is required");
  }

  const requestOptions: NextRequestOptions = {
    ...options,
    credentials: "include",
    method: "POST",
    cache: "no-store",
    next: {
      ...options?.next,
    },
  };
  if (props.mode) {
    const body = new FormData();
    body.set("data", JSON.stringify({ mode: props.mode }));
    requestOptions.body = body;
  }

  const res = await fetch(
    `${host}${route}/${encodeURIComponent(id)}/ecommerce-module/orders/${encodeURIComponent(orderId)}/repeat`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
