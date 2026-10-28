import type { IModel } from "@sps/website-builder/models/feature/sdk/model";
import type {
  IComponentProps as IParentProps,
  IComponentPropsExtended as IParentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "step" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentPropsExtended<IModel, typeof variant, IComponentProps> {}
