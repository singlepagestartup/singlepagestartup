import type { ReactNode } from "react";
import type { IModel } from "@sps/file-storage/models/file/sdk/model";
import type { IResult } from "@sps/file-storage/models/file/sdk/client";
import type { IComponentProps as IParentComponentProps } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "authenticated-content" as const;

/** The granted parent owns live File metadata; only SDK content bytes are read here. */
export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  dataSource: "props";
  language: string;
  containerClassName?: string;
}

export interface IComponentPropsExtended extends IComponentProps {
  content?: IResult["IContentResult"];
  loading: boolean;
  error?: string;
  onRetry: () => void;
}

export interface IProtectedMediaProviderProps {
  children: ReactNode;
  /** Non-secret identity of the principal/resource/slot; changes reset the scope. */
  scopeKey: string;
}
