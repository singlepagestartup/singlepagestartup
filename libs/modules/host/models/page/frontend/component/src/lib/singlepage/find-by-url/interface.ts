export { type IModel } from "@sps/host/models/page/sdk/model";
import { IModel } from "@sps/host/models/page/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Dispatch, ReactNode, SetStateAction } from "react";

export const variant = "find-by-url" as const;

export interface IComponentProps extends Omit<ISpsComponentBase, "children"> {
  variant: typeof variant;
  url: string;
  set?: Dispatch<SetStateAction<IModel | undefined>>;
  children?: ({ data }: { data: IModel | undefined }) => ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
