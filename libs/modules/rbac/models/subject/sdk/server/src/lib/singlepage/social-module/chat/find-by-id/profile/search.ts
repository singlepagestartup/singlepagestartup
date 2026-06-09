import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

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

export type IResult = ISocialModuleProfile[];

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
    `${host}${route}/${id}/social-module/chats/${socialModuleChatId}/profiles/search?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
