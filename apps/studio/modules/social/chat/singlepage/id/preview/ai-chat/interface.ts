import type { IAIChatWebsiteContent } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "id-preview-ai-chat";

export interface IChatPreviewProps {
  variant?: "id-preview-ai-chat";
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

type IVariantInputs = NonNullable<IChatPreviewProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-preview-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
