import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  host?: string;
  redirectTo?: string;
  catchErrors?: boolean;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = {
  ok: boolean;
};

export async function action(props: IProps): Promise<IResult> {
  const { params, options, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const headers = new Headers(options?.headers);
  headers.set("Cache-Control", "no-store");

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    ...options,
    headers,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/authentication/logout?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
