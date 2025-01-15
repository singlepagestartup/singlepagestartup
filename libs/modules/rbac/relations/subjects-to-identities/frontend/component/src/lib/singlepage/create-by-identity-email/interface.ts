export { type IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "create-by-identity-email" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  subjectId: string;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
