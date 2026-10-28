import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "loading" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
