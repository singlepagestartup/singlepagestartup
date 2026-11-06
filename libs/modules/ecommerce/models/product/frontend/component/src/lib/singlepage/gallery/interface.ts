import type { ReactNode } from "react";
import type { IModel } from "@sps/ecommerce/models/product/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "gallery" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  includeAllMedia?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
export interface IGalleryItem {
  id: string;
  content: ReactNode;
  thumbnail?: string;
  label: string;
}
export interface IGalleryClientProps {
  id: string;
  title: string;
  language: string;
  items: IGalleryItem[];
  className?: string;
}
