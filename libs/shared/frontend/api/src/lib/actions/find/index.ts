import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IProps {
  route: string;
  host: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult<T> = T[] | undefined;

export async function action<T>(props: IProps): Promise<IResult<T>> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { params, route, options, host } = props;

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
    signal: AbortSignal.timeout(10000),
  };

  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const res = await fetch(
        `${host}${route}?${stringifiedQuery}`,
        requestOptions,
      );

      const json = await responsePipe<{ data: IResult<T> }>({
        res,
        catchErrors: props.catchErrors || productionBuild,
      });

      if (!json) {
        return;
      }

      const transformedData = transformResponseItem<IResult<T>>(json);

      return transformedData;
    } catch (error) {
      lastError = error;
      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}
