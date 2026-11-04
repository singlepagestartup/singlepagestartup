import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "me-authentication-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  language: string;
  variant: typeof variant;
}
