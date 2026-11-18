import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-table" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  url: string;
}
