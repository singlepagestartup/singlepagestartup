export { type IModel } from "@sps/website-builder/models/modal/sdk/model";
import { IModel } from "@sps/website-builder/models/modal/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "list" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel[];
}
