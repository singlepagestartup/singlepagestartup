import { host, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  catchErrors?: boolean;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = {
  jwt: string;
  refresh: string;
};

export async function action(props: IProps): Promise<IResult> {
  const { params, options } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
    headers: {
      "Cache-Control": "no-cache",
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
