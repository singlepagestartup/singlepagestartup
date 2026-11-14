import { IRenderRequest } from "@sps/notification/models/template/sdk/model";

export const variant = "content-telegram" as const;

export interface IResponseProps extends IRenderRequest {
  variant: typeof variant;
}
