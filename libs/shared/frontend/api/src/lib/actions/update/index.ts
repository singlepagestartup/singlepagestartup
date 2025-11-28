import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  route: string;
  host: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: any;
}

export type IResult<T> = T;

export async function action<T>(props: IProps): Promise<IResult<T>> {
  const { id, params, data, route, options, host } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult<T> }>({
    res,
  });

  const transformedData = transformResponseItem<IResult<T>>(json);

  return transformedData;
}
