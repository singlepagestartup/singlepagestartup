import { host, route } from "@sps/broadcast/models/channel/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IMessge } from "@sps/broadcast/models/message/sdk/model";

export interface IProps {
  id: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = IMessge[];

export async function action(props: IProps): Promise<IResult | undefined> {
  const { id, params, options } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/messages?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
