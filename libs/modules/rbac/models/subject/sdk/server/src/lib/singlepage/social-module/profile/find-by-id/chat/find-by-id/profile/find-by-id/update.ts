import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
  data: {
    adminTitle?: string;
    title?: Record<string, string | undefined>;
    subtitle?: Record<string, string | undefined>;
    description?: Record<string, string | undefined>;
  };
}

export type IResult = ISocialModuleProfile;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    targetSocialModuleProfileId,
    options,
    host = serverHost,
    data,
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
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
