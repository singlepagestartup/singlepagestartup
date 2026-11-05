export { type IModel } from "@sps/website-builder/models/widget/sdk/model";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "content-hero" as const;
export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
