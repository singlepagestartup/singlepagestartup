export { type IModel } from "@sps/rbac/models/identity/sdk/model";
import { IModel } from "@sps/rbac/models/identity/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "create-by-email" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  className?: string;
  successCallback?: (data: IModel) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
