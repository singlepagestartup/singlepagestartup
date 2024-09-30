export { type IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { IModel } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { IFindByIdActionProps } from "@sps/shared-frontend-api";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "get-identity-emails" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
  apiProps?: {
    params?: IFindByIdActionProps["params"];
    options?: IFindByIdActionProps["options"];
  };
  className?: string;
  children?: ({ data }: { data?: string | null }) => any;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
