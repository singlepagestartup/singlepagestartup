import {
  NextRequestOptions,
  prepareFormDataToSend,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IActionProps {
  id: string;
  route: string;
  host: string;
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
  const { params, route, tag, options, host } = props;

  const formData = prepareFormDataToSend(params.data);

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
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
    `${host}${route}?${stringifiedQuery}`,
    requestOptions,
  );

  if (!res.ok) {
    const error = new Error(res.statusText);

    throw new Error(error.message || "Failed to fetch data");
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || "Failed to fetch data");
  }
  const transformedData = transformResponseItem<T>(json);

  return transformedData;
}
