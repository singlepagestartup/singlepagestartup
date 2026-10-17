import type { ReactNode } from "react";

import type { IdentityAction, RbacIdentity } from "../../../shared";

export const variant = "card-default";

export interface IIdentityFlowProps {
  identity: RbacIdentity;
  action: "change-email" | "change-password" | "reconnect";
  onClose: () => void;
  onUpdate: (identity: RbacIdentity) => void;
}

export interface IdentityCardDefaultProps {
  variant?: "card-default";
  actions?: ReactNode;
  renderFlow?: (props: IIdentityFlowProps) => ReactNode;
  identity: RbacIdentity;
  lastOperationLabel?: string;
  onAction?: (identity: RbacIdentity, action: IdentityAction) => void;
  onUpdate?: (identity: RbacIdentity) => void;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<Partial<IdentityCardDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
