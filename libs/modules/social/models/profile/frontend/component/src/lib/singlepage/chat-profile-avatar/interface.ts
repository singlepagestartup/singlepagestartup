export { type IModel } from "@sps/social/models/profile/sdk/model";
import { IModel } from "@sps/social/models/profile/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import type { ReactNode } from "react";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";

export const variant = "chat-profile-avatar" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  fallback?: ReactNode;
  file?: IFile | null;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
