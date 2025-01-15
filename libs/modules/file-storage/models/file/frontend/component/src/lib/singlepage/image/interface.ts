export { type IModel } from "@sps/file-storage/models/file/sdk/model";
import { IModel } from "@sps/file-storage/models/file/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "image" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
  containerClassName?: string;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
