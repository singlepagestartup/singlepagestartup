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
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export type IResult = ISocialModuleProfile[];

export async function action(props: IProps): Promise<IResult> {
  const host = props.host ?? serverHost;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...props.options,
    next: { ...props.options?.next },
  };
  const res = await fetch(
    `${host}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
