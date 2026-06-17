import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import QueryString from "qs";

export interface IProps {
  id: string;
  socialModuleChatId: string;
  q: string;
  limit?: number;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IModel[];

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleChatId,
    q,
    limit,
    options,
    host = serverHost,
  } = props;

  const stringifiedQuery = QueryString.stringify(
    {
      q,
      limit,
    },
    {
      encodeValuesOnly: true,
    },
  );

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}/agent-subjects/search?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
