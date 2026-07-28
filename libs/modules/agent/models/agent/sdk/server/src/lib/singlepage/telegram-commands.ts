import { serverHost, route } from "@sps/agent/models/agent/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IResultItem {
  command: string;
  description: string;
}

export interface IProps {
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IResultItem[];

export async function action(props: IProps = {}): Promise<IResult> {
  const { options, host = serverHost } = props;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(`${host}${route}/telegram/commands`, requestOptions);
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
