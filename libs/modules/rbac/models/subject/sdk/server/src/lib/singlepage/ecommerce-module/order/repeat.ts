import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  orderId: string;
  params: {
    socialModuleProfileId: string;
  };
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export interface IResult {
  orderIds: string[];
}

export async function action(props: IProps): Promise<IResult> {
  const { id, orderId, params, options, host = serverHost } = props;
  const socialModuleProfileId = params?.socialModuleProfileId;

  if (!id) {
    throw new Error("Validation error. id is required");
  }
  if (!orderId) {
    throw new Error("Validation error. orderId is required");
  }
  if (!socialModuleProfileId) {
    throw new Error("Validation error. socialModuleProfileId is required");
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

  const res = await fetch(
    `${host}${route}/${encodeURIComponent(id)}/social-module/profiles/${encodeURIComponent(socialModuleProfileId)}/ecommerce-module/orders/${encodeURIComponent(orderId)}/repeat`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
