import type { IModel } from "@sps/knowledge/models/source/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/admin/form/interface";

export interface IEditorOptions {
  language?: string;
  placeholder?: string;
  onSave: (value: { title: string; content: string }) => Promise<void | string>;
  onDiscuss?: () => void;
  attachments?: React.ReactNode;
  onAttach?: (files: FileList) => Promise<void | string>;
}

export const variant = "form-ai-chat" as const;
export interface IComponentProps
  extends IParent<IModel, typeof variant>,
    IEditorOptions {
  title?: string;
  content?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IClientComponentProps
  extends Omit<IComponentPropsExtended, "variant"> {
  variant: typeof variant | "id-ai-chat";
}
