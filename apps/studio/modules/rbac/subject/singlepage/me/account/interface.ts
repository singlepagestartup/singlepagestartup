import type { RbacAccountUser } from "../../../../shared";

export const variant = "me-account";

export interface ISubjectAccountProps {
  variant?: "me-account";
  showTokens?: boolean;
  authorPublished?: boolean;
  signedIn?: boolean;
  user?: RbacAccountUser;
  page?: string;
  balance?: {
    free: number;
    purchased: number;
  } | null;
  onNavigate?: () => void;
}

type IVariantInputs = NonNullable<ISubjectAccountProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-account";
}

export interface IComponentPropsExtended extends IComponentProps {}
