import { IRenderRequest } from "@sps/notification/models/template/sdk/model";

export const variant = "content-email" as const;

export interface IComponentProps extends IRenderRequest {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
