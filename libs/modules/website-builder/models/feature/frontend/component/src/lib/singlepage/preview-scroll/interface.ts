import type { IModel } from "@sps/website-builder/models/feature/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "preview-scroll" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
