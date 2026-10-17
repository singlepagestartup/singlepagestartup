import type { SVGProps } from "react";
import type { glyphs } from "./glyphs";

export type IconName = keyof typeof glyphs;

export interface IIconProps
  extends Omit<SVGProps<SVGSVGElement>, "name" | "children"> {
  name: IconName;
  size?: 20 | 24;
  svgProps?: SVGProps<SVGSVGElement>;
}
