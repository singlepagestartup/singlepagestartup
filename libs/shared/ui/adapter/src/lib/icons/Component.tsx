import { twMerge } from "tailwind-merge";
import { glyphs } from "./glyphs";
import type { IIconProps } from "./interface";

export function Icon({
  name,
  size = 20,
  className,
  svgProps,
  ...props
}: IIconProps) {
  return (
    <svg
      className={twMerge(
        size === 24 ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0",
        className,
      )}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...props}
      {...svgProps}
    >
      {glyphs[name]}
    </svg>
  );
}
