export { type IModel } from "@sps/host/models/page/sdk/model";
import { IModel } from "@sps/host/models/page/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "url-segment-value" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  segment: string;
  children?: (props: { data: string | undefined }) => any;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
