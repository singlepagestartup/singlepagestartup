import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "content-ecommerce-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  children?: React.ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
