import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "landing-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

import type { IAIChatWebsiteContent } from "@sps/shared-utils";
export interface IChatPreviewProps {
  className?: string;
  content?: IAIChatWebsiteContent;
}
export interface IThreadRowProps {
  name: string;
  value?: string;
  selected: boolean;
  disabled?: boolean;
  status?: string;
  topic?: boolean;
  onSelect: (name: string) => void;
}
export interface IAttachedDocument {
  name: string;
  text: string;
}
export interface IThreadMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  documents?: IAttachedDocument[];
}
export interface ITopic {
  id: string;
  title: string;
  documents: string[];
  messages: IThreadMessage[];
}
export type TView = "materials" | "document" | "files" | "workspace" | "topic";
