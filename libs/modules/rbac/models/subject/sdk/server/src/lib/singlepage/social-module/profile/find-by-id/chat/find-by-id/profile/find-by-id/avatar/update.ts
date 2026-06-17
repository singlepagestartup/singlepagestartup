import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as ISocialModuleProfilesToFileStorageModuleFile } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/model";

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
    file: File;
  };
}

export type IResult = {
  file: IFileStorageModuleFile;
  relation: ISocialModuleProfilesToFileStorageModuleFile;
};

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

  const formData = prepareFormDataToSend({ data });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/profiles/${targetSocialModuleProfileId}/avatar`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
