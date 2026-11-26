import type { ReactNode } from "react";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export interface IPresentationSlots {
  heading?: string;
  summary?: string;
  description?: string;
  media?: ReactNode;
  price?: ReactNode;
  note?: ReactNode;
}

export const variant = "content-service-detail" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  children?: ReactNode;
  slots?: IPresentationSlots;
}

export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IServicePaymentTimingProps {
  language: string;
  afterAcceptance: boolean;
}
