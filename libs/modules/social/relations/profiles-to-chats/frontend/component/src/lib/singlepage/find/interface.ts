export { type IModel } from "@sps/social/relations/profiles-to-chats/sdk/model";
import { IModel } from "@sps/social/relations/profiles-to-chats/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { Dispatch, SetStateAction } from "react";

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
