import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: {
    [key: string]: any;
  };
}

export type IResult = {
  scanned: number;
  deleted: number;
  failed: number;
  retained: number;
  retainedByReason: Record<string, number>;
} | null;

export async function action(props: IProps): Promise<IResult> {
  const { data, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({ data: data || {} });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(`${host}${route}/delete-anonymous`, requestOptions);

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
