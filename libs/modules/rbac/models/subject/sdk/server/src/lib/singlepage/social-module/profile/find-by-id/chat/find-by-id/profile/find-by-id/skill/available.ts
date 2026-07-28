import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  limit?: number;
  offset?: number;
  search?: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleSkill[];

export async function action(props: IProps): Promise<IResult> {
  const query = new URLSearchParams();
  if (props.limit !== undefined) query.set("limit", String(props.limit));
  if (props.offset !== undefined) query.set("offset", String(props.offset));
  if (props.search) query.set("search", props.search);
  const suffix = query.size ? `?${query}` : "";
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...props.options,
    next: { ...props.options?.next },
  };
  const res = await fetch(
    `${props.host ?? serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills/available${suffix}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
