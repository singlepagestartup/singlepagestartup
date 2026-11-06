import type { UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { IFilePreviewProps, IFilePreviewTextProps } from "@sps/ui-adapter";
import type { IModel } from "@sps/file-storage/models/file/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "attachment-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  textContent: ReactNode;
}

export interface IClientProps
  extends Pick<IComponentProps, "data" | "variant" | "language"> {}

export interface IClientComponentProps extends IFilePreviewProps {
  fileId: string;
  variant: typeof variant;
}

export interface ITextContentProps {
  language?: string;
  /** Byte query uses the File SDK; parent retains the authorized live File record. */
  file: IModel;
}

export interface ITextContentViewProps extends IFilePreviewTextProps {
  isPending: boolean;
  error?: string;
  onRetry: () => void;
}
