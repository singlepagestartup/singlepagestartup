export { type IModel } from "@sps/host/models/page/sdk/model";
import { IModel } from "@sps/host/models/page/sdk/model";
import { Dispatch, SetStateAction } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";

export const variant = "find" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  set?: Dispatch<SetStateAction<IModel[] | undefined>>;
  children?: ({ data }: { data: IModel[] | undefined }) => any;
  apiProps?: {
    params?: IFindProps["params"];
    options?: IFindProps["options"];
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
