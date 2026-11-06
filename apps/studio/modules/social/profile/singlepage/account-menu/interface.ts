import type { IAIChatUserProfile } from "../scope/ai-chat/project/models";

export const variant = "account-menu";

export interface IAccountMenuProps {
  variant?: "account-menu";
  data?: IAIChatUserProfile;
  email?: string;
  balance?: {
    free: number;
    purchased: number;
  } | null;
  showTokens?: boolean;
  page?: string;
  settingsHref?: string;
  createArticleHref?: string;
  authorHref?: string;
  chatsHref?: string;
  settingsTarget?: "_top";
  onNavigate?: () => void;
  onSignOut?: () => void;
}

type IVariantInputs = NonNullable<IAccountMenuProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "account-menu";
}

export interface IComponentPropsExtended extends IComponentProps {}
