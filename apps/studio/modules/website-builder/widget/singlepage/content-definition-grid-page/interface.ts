import type { IComponentProps as IBaseProps } from "../content-definition-grid/interface";
export const variant = "content-definition-grid-page" as const;
export interface IComponentProps
  extends Omit<IBaseProps, "variant" | "headingLevel"> {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
