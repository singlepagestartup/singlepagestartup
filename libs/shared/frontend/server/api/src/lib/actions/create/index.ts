"use server";

import {
  BACKEND_URL,
  NextRequestOptions,
  prepareFormDataToSend,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { cookies } from "next/headers";

export interface IActionProps {
  id: string;
  model: string;
  path: string;
  tag?: string;
  revalidate?: number;
  params: {
    data: any;
    [key: string]: any;
  };
  options?: NextRequestOptions;
  data: any;
}

export async function action<T>(props: IActionProps): Promise<T> {
  const { params, model, path, tag, options } = props;

  const formData = prepareFormDataToSend(params.data);

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    headers: { Cookie: cookies().toString() },
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      tags: tag ? [tag] : [],
      ...options?.next,
    },
  };

  const res = await fetch(
    `${BACKEND_URL}${path}/${model}?${stringifiedQuery}`,
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
