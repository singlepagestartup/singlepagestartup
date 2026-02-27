import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-model-header" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  adminBasePath: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
