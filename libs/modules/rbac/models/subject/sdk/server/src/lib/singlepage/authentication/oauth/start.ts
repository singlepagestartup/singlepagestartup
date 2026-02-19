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
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  provider: string;
  data?: {
    flow?: "signin" | "link";
    redirectTo?: string;
  };
}

export type IResult = {
  state: string;
  authorizationUrl: string;
};

export async function action(props: IProps): Promise<IResult> {
  const { provider, params, data, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({ data: data || {} });

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
    `${host}${route}/authentication/oauth/${provider}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
