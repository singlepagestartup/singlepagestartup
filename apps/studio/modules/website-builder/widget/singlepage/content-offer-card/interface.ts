import type { IComponentProps as IBaseProps } from "../content-offer/interface";

export const variant = "content-offer-card" as const;
export interface IComponentProps
  extends Omit<IBaseProps, "variant" | "appearance" | "embedded"> {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
