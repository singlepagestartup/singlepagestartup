import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IKnowledgeModuleSource } from "@sps/knowledge/models/source/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  knowledgeModuleSourceId: string;
  unlink?: boolean;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
}

export type IResult = IKnowledgeModuleSource;

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    socialModuleChatId,
    targetSocialModuleProfileId,
    knowledgeModuleSourceId,
    options,
    host = serverHost,
  } = props;

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "DELETE",
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}/knowledge/sources/${knowledgeModuleSourceId}${props.unlink ? "?unlink=true" : ""}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
