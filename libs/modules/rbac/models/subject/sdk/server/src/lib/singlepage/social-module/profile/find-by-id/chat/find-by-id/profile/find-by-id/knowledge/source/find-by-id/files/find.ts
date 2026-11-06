import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IModel as IRelation } from "@sps/knowledge/relations/sources-to-file-storage-module-files/sdk/model";
import type { IModel as ISource } from "@sps/knowledge/models/source/sdk/model";
export interface IProps {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  knowledgeModuleSourceId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type SourceFile = { file: IFile; relation: IRelation };
export type IResult = SourceFile[];
export async function action(props: IProps): Promise<IResult> {
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}/files`,
    { credentials: "include", method: "GET", ...props.options },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
