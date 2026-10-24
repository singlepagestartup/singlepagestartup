import type { ReactNode } from "react";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParentProps,
  IComponentPropsExtended as IParentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "content-offer" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentPropsExtended<IModel, typeof variant, IComponentProps> {}

export interface IPresentationProps {
  data: IModel;
  isServer?: boolean;
  language: string;
  className?: string;
  children?: ReactNode;
  variant: "content-offer" | "content-offer-card";
  card?: boolean;
}
