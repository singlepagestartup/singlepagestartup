import type { SlideProps } from "../../../slide";
export type SliderNavigation = "arrows" | "numbers" | "dots";
export const variant = "default";
export interface IComponentProps {
  variant?: "default";
  label?: string;
  navigation?: SliderNavigation;
  slides?: SlideProps[];
}
export interface IComponentPropsExtended extends IComponentProps {}
