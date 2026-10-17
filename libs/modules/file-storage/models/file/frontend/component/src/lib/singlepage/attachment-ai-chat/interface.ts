import type { UseQueryOptions } from "@tanstack/react-query";
import type { IFilePreviewProps } from "@sps/ui-adapter";
import type { IModel } from "@sps/file-storage/models/file/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "attachment-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IClientComponentProps extends IFilePreviewProps {
  fileId: string;
  variant: typeof variant;
}

export interface ITextContentProps {
  /** Byte query uses the File SDK; parent retains the authorized live File record. */
  file: IModel;
}
