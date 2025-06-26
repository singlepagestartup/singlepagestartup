import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleMessage[];

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    params,
    options,
    host = serverHost,
  } = props;

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
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/messages?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
