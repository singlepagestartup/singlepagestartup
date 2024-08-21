"use server";

import { host, route, IModel } from "@sps/billing/models/invoice/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IActionProps {
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  provider: "stripe";
  options?: NextRequestOptions;
  data: any;
}

export async function action(props: IActionProps): Promise<IModel | undefined> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const provider = props.provider;
  const { data, params, options } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const formData = prepareFormDataToSend({ data });

  const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-cache" }
    : {};

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    method: "POST",
    body: formData,
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
    `${host}${route}/${provider}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IModel }>({
    res,
    catchErrors: props.catchErrors || productionBuild,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IModel>(json);

  return transformedData;
}
