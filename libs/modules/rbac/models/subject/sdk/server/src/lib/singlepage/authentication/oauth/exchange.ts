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
  /**
   * Optional: the callback hands the code over as an HttpOnly cookie, and the
   * body is read only while `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY` is on.
   */
  data?: {
    code?: string;
  };
}

export type IResult = {
  jwt: string;
  refresh: string;
};

export async function action(props: IProps): Promise<IResult> {
  const { params, data, options, host = serverHost } = props;

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
    `${host}${route}/authentication/oauth/exchange?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
