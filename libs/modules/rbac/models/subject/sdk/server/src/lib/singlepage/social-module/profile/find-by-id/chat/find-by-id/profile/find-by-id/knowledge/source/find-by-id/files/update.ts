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
  data: {
    files?: File[];
    removeFileId?: string;
    replaceFileId?: string;
    reanalyze?: boolean;
  };
}
export type SourceFile = { file: IFile; relation: IRelation };
export type IResult = {
  files: SourceFile[];
  source: ISource | null;
  processingError?: string;
};
export async function action(props: IProps): Promise<IResult> {
  const body = new FormData();
  for (const file of props.data.files || []) body.append("files", file);
  if (props.data.removeFileId)
    body.set("removeFileId", props.data.removeFileId);
  if (props.data.reanalyze) body.set("reanalyze", "true");
  if (props.data.replaceFileId)
    body.set("replaceFileId", props.data.replaceFileId);
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}/files`,
    { credentials: "include", method: "POST", body, ...props.options },
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
