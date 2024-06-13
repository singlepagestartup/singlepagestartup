"use server";

import {
  BACKEND_URL,
  NextRequestOptions,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { cookies } from "next/headers";

export async function action<T>(params: {
  id: string;
  model: string;
  populate: any;
  rootPath?: string;
  tag?: string;
  revalidate?: number;
}): Promise<T> {
  const {
    id,
    populate,
    model,
    rootPath = "/api/sps-website-builder",
    tag,
    revalidate = 0,
  } = params;

  const stringifiedQuery = QueryString.stringify(
    {
      populate,
    },
    {
      encodeValuesOnly: true,
    },
  );

  const options: NextRequestOptions = {
    next: {
      revalidate,
    },
    headers: { Cookie: cookies().toString() },
    credentials: "include",
  };

  if (tag) {
    options.next.tags = [tag];
  }

  const res = await fetch(
    `${BACKEND_URL}${rootPath}/${model}/${id}?${stringifiedQuery}`,
    options,
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