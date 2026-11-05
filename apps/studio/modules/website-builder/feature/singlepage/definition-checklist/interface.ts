import type { IComponentProps as IBaseProps } from "../definition-card/interface";

export const variant = "definition-checklist" as const;
export interface IComponentProps
  extends Omit<IBaseProps, "variant" | "appearance"> {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
