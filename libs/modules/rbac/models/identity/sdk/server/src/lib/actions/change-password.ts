"use server";

import { host, route, IModel } from "@sps/rbac/models/identity/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IActionProps {
  id: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
  data: any;
}

export async function action(props: IActionProps): Promise<IModel | undefined> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { id, params, options, data } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-cache" }
    : {};

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    body: formData,
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
    `${host}${route}/${id}/change-password?${stringifiedQuery}`,
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
