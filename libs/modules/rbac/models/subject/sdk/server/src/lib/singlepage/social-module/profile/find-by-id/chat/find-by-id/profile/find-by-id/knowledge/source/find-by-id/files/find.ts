import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  readChatAttachmentBlob,
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
  const res = await fetch(filesUrl(props), {
    credentials: "include",
    method: "GET",
    ...props.options,
  });
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}

function filesUrl(props: IProps) {
  return `${props.host || serverHost}${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}/files`;
}
export async function downloadImage(
  props: IProps,
  fileId: string,
  maxBytes?: number,
) {
  const res = await fetch(
    `${filesUrl(props)}?image=${encodeURIComponent(fileId)}`,
    {
      credentials: "include",
      ...props.options,
      cache: "no-store",
      method: "GET",
    },
  );
  if (!res.ok) {
    await responsePipe({ res });
    throw new Error("Knowledge image is unavailable");
  }
  return readChatAttachmentBlob(res, maxBytes);
}
