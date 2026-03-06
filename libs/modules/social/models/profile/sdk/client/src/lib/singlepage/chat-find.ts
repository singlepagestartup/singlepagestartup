"use client";

import { clientHost, route } from "@sps/social/models/profile/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as IChat } from "@sps/social/models/chat/sdk/model";

export interface IFindByIdChatFindProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IFindByIdChatFindResult = IChat[];

export async function action(
  props: IFindByIdChatFindProps,
): Promise<IFindByIdChatFindResult | undefined> {
  const { id, params, options, host = clientHost } = props;

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
    `${host}${route}/${id}/chats?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IFindByIdChatFindResult }>({
    res,
  });

  if (!json) {
    return;
  }

  return transformResponseItem<IFindByIdChatFindResult>(json);
}
