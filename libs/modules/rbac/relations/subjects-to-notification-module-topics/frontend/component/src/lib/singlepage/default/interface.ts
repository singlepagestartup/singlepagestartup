export { type IModel } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/model";
import { IModel } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  className?: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
