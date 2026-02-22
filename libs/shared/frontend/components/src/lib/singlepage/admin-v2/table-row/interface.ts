import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";

export interface IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> extends ISpsComponentBase {
  variant: V;
  data?: M;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  className?: string;
  adminForm?: (props: ISpsComponentBase & { data?: M }) => ReactNode;
  onDelete?: (e: any) => void;
  type?: "model" | "relation";
  module?: string;
  name?: string;
  children?: ReactNode;

  // Draft/headless mode props used by admin-panel-draft.
  entity?: {
    id: string;
    adminTitle?: string;
    title?: string;
    shortDescription?: string;
    slug?: string;
    variant?: string;
  };
  selectedModel?: string;
  selectedModule?: string;
  copyFeedback?: Record<string, boolean>;
  tid?: (
    prefix: string,
    ...parts: Array<string | number | null | undefined>
  ) => string;
  copyToClipboard?: (value?: string) => void;
  openPreviewDialog?: (modelName: string, entityId: string) => void;
  openEntityEditorById?: (
    id: string | null,
    options?: { append?: boolean; modelName?: string; moduleId?: string },
  ) => void;
  openConfirmDialog?: (config: {
    actionType:
      | ""
      | "entity-delete"
      | "relation-delete"
      | "settings-operation"
      | "identity-operation"
      | "identity-delete"
      | "logout-account";
    title: string;
    description: string;
    confirmLabel: string;
    payload: any;
  }) => void;
}

export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  data: M;
};
