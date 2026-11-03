import type { IToasterProps } from "@sps/ui-adapter/toast";
export const variant = "default";
export interface IComponentProps {
  variant?: typeof variant;
  type?: "default" | "success" | "error" | "warning" | "info" | "loading";
  title?: string;
  description?: string;
  actionLabel?: string;
  persistent?: boolean;
  duration?: number;
  position?: IToasterProps["position"];
  appearance?: "single" | "all" | "stacked";
}
export interface IComponentPropsExtended extends IComponentProps {}
