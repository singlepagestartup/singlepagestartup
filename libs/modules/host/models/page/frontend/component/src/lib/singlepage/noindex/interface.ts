import type {
  IModel,
  IComponentProps as IDefaultProps,
} from "../default/interface";
import type { IComponentPropsExtended as IParentPropsExtended } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "noindex" as const;
export interface IComponentProps extends Omit<IDefaultProps, "variant"> {
  variant: typeof variant;
}
export interface IComponentPropsExtended
  extends IParentPropsExtended<IModel, typeof variant, IComponentProps> {}
