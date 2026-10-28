import type { IComponentProps as IBaseProps } from "../content-feature-split/interface";

export const variant = "content-feature-split-reverse" as const;
export interface IComponentProps
  extends Omit<IBaseProps, "variant" | "mediaPosition"> {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
