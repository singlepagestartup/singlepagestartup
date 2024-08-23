export { type IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "get-identity-emails" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  className?: string;
  children?: ({ data }: { data?: string | null }) => any;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
