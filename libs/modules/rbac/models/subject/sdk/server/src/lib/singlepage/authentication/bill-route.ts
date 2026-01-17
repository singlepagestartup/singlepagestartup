import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  host?: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params: {
    permission: {
      route: string;
      method: string;
      type?: "HTTP";
    };
  };
  options?: any;
  data: any;
}

export type IResult = { ok: true } | undefined;

export async function action(props: IProps): Promise<IResult> {
  const { params, options, host = serverHost, data } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/authentication/bill-route?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
