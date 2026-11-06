import type { IComponentProps, IconName, IIconProps } from "./interface";
export type { IconName, IIconProps } from "./interface";
import icons from "./icons.json";
import { twMerge } from "tailwind-merge";

export function Component({
  variant = "phosphor",
  name,
  size = 20,
  className,
  svgProps,
}: IComponentProps) {
  const source = iconSources[name];
  const geometry = source
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error(`Missing registered Phosphor icon: ${name}`);
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
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
      data-module="shared"
      data-model="icon"
      data-variant={variant}
    />
  );
}
const iconSources: Record<IconName, string> = icons;
