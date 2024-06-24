"use server";

import {
  BACKEND_URL,
  NextRequestOptions,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IActionProps {
  id: string;
  model: string;
  path: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export async function action<T>(props: IActionProps): Promise<T> {
  const { id, params, model, path, tag, options } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    next: {
      tags: tag ? [tag] : [],
      ...options?.next,
    },
  };

  const res = await fetch(
    `${BACKEND_URL}${path}/${model}/${id}?${stringifiedQuery}`,
    requestOptions,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "Failed to fetch data");
  }

  const transformedData = transformResponseItem<T>(json);

  return transformedData;
}