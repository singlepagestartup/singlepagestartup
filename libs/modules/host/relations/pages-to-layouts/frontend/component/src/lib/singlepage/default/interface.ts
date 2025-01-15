export { type IModel } from "@sps/host/relations/pages-to-layouts/sdk/model";
import { IModel } from "@sps/host/relations/pages-to-layouts/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";
import { IFindByIdProps } from "@sps/shared-frontend-api";

export const variant = "default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
  children?: ReactNode;
  apiProps?: {
    params?: IFindByIdProps["params"];
    options?: IFindByIdProps["options"];
  };
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
