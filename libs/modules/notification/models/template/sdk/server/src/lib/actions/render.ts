import { serverHost, route } from "@sps/notification/models/template/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: any;
}

export type IResult = string;

export async function action(props: IProps): Promise<IResult> {
  const { id, params, data, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/render?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{
    data: IResult;
  }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
