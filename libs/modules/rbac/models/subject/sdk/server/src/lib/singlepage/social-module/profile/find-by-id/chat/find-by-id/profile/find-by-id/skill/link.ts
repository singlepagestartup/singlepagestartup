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
  socialModuleSkillId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleSkill;

export async function action(props: IProps): Promise<IResult> {
  const res = await fetch(
    `${props.host ?? serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills/${props.socialModuleSkillId}`,
    { credentials: "include", method: "POST", ...props.options },
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
