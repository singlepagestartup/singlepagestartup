export { type IModel } from "@sps/broadcast/models/channel/sdk/model";
import { IModel } from "@sps/broadcast/models/channel/sdk/model";
import { Dispatch, SetStateAction } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "find-by-id" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  id: string;
  set?: Dispatch<SetStateAction<IModel | undefined>>;
  children?: ({ data }: { data: IModel | undefined }) => any;
}

export interface IComponentPropsExtended extends IComponentProps {}
