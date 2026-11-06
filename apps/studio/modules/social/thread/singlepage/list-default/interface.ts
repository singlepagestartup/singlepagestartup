import type { SocialPreviewAttachment } from "../../../widget/singlepage/chat-overview-default/utils";

export const variant = "list-default";

export interface SocialThreadListDefaultProps {
  variant?: "list-default";
  title: string;
  description: string;
  selectedId?: string;
  onSelectThread?: (id: string) => void;
  onOpenSettings?: () => void;
  chatImage?: SocialPreviewAttachment;
  threads: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: string;
    unread: number;
    author?: string;
    active?: boolean;
    pinned?: boolean;
    description?: string;
  }>;
}

export interface SocialPreviewProfile {
  id: string;
  name: string;
  context?: string;
}

type IVariantInputs = NonNullable<Partial<SocialThreadListDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
