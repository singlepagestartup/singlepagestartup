import { host, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IActionProps {
  id: string;
  identityId: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export async function action(props: IActionProps): Promise<IModel> {
  const { id, params, options } = props;
  const identityId = props.identityId;

  if (!identityId) {
    throw new Error("identityId is required");
  }

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "DELETE",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/identities/${identityId}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IModel }>({
    res,
  });

  const transformedData = transformResponseItem<IModel>(json);

  return transformedData;
}
