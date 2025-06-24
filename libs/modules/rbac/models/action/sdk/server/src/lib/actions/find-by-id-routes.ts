import { serverHost, route, IModel } from "@sps/rbac/models/action/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IProps {
  id: string;
  host?: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params?: any;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IModel & {
  routes: string[];
};

export async function action(props: IProps): Promise<IResult> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { params, options, id, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-store" }
    : {};

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    headers: {
      ...cacheControlOptions,
      ...options?.headers,
    },
    next: {
      tags: [route],
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/routes?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
    catchErrors: props.catchErrors || productionBuild,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
