import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IOpenRouterModelFavoritesResult {
  favoriteModelIds: string[];
}

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
  data?: IOpenRouterModelFavoritesResult;
}

export type IResult = IOpenRouterModelFavoritesResult;

export async function find(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    options,
    host = serverHost,
  } = props;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/openrouter/model-favorites`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}

export async function update(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    options,
    host = serverHost,
    data = {
      favoriteModelIds: [],
    },
  } = props;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify({ data }),
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/openrouter/model-favorites`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
