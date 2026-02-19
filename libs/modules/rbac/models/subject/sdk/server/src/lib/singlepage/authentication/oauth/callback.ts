import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import { NextRequestOptions, responsePipe } from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  host?: string;
  params?: {
    state?: string;
    code?: string;
    error?: string;
    error_description?: string;
    errorDescription?: string;
  };
  options?: Partial<NextRequestOptions>;
  provider: string;
}

export type IResult = {
  redirectUrl: string;
};

export async function action(props: IProps): Promise<IResult> {
  const { provider, params, options, host = serverHost } = props;

  const normalizedParams = {
    ...params,
    ...(params?.errorDescription && !params?.error_description
      ? { error_description: params.errorDescription }
      : {}),
  };

  const stringifiedQuery = QueryString.stringify(normalizedParams, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    redirect: "manual",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/authentication/oauth/${provider}/callback?${stringifiedQuery}`,
    requestOptions,
  );

  const location = res.headers.get("location");
  if (location) {
    return {
      redirectUrl: location,
    };
  }

  if (!res.ok) {
    await responsePipe({
      res,
    });
  }

  return {
    redirectUrl: res.url,
  };
}
