import type { ReactNode } from "react";
import type { IModel } from "@sps/website-builder/models/feature/sdk/model";
import type {
  IComponentProps as IParentProps,
  IComponentPropsExtended as IParentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "copy-request" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentPropsExtended<IModel, typeof variant, IComponentProps> {}

export interface ICopyRequestViewProps {
  recordId: string;
  title: string;
  text: string;
  description: ReactNode;
  className?: string;
  dataClassName?: string;
  copyLabel: string;
  pendingLabel: string;
  successLabel: string;
  errorLabel: string;
  idleLabel: string;
  emptyLabel: string;
}
