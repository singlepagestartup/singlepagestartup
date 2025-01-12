export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "identity-get-emails" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
  className?: string;
  children?: ({ data }: { data?: string | null }) => any;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
