import {
  route,
  serverHost,
  type IModel,
} from "@sps/broadcast/relations/channels-to-messages/sdk/model";
import type { IModel as IMessage } from "@sps/broadcast/models/message/sdk/model";
import {
  consistencyRequestOptions,
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IFeedMessage {
  relation: IModel;
  message: IMessage;
}
export type IResult = IFeedMessage | null;
export async function action({
  id,
  host = serverHost,
  options,
}: IProps): Promise<IResult> {
  const url = `${host}${route}/${encodeURIComponent(id)}/message`;
  const requestOptions = await consistencyRequestOptions(url, {
    ...options,
    method: "GET",
    credentials: "include",
    cache: "no-store",
    next: { ...options?.next },
  });
  const res = await fetch(url, requestOptions);
  const json = await responsePipe<{ data: IResult }>({ res });
  if (!json?.data) {
    return null;
  }
  return transformResponseItem<IFeedMessage>({ data: json.data });
}
