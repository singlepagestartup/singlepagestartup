import {
  route,
  IResolvedPage,
  serverHost,
} from "@sps/host/models/page/sdk/model";
import {
  NextRequestOptions,
  consistencyRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

interface Params {
  host?: string;
  url: string;
  language?: string;
  catchErrors?: boolean;
  /** Treat only an actual HTTP 404 as an absent page; other failures still throw. */
  silentNotFound?: boolean;
  silentErrorStatuses?: number[];
  options?: Partial<NextRequestOptions>;
}

export async function action({
  host = serverHost,
  url,
  language,
  catchErrors = false,
  silentNotFound = false,
  silentErrorStatuses,
  options: requestOptions,
}: Params) {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const noCache = productionBuild;

  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-store" }
    : {};

  const options: NextRequestOptions = {
    ...requestOptions,
    cache: requestOptions?.cache,
    headers: {
      ...cacheControlOptions,
      ...requestOptions?.headers,
    },
    next: {
      ...requestOptions?.next,
      tags: [...new Set([route, ...(requestOptions?.next?.tags || [])])],
    },
  };

  const stringifiedQuery = QueryString.stringify(
    {
      url,
      language,
    },
    {
      encodeValuesOnly: true,
    },
  );

  const requestUrl = `${host}${route}/find-by-url?${stringifiedQuery}`;
  const res = await fetch(
    requestUrl,
    await consistencyRequestOptions(requestUrl, options),
  );

  if (silentNotFound && res.status === 404) {
    return undefined;
  }

  const json = await responsePipe<{ data: IResolvedPage }>({
    res,
    catchErrors,
    silentErrorStatuses,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IResolvedPage>(json);

  if (!transformedData?.id) {
    return;
  }

  return transformedData;
}
