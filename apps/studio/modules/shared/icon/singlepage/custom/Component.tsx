import icons from "./icons.json";
import type { IComponentProps } from "./interface";
import { twMerge } from "tailwind-merge";
export function Component({
  name,
  variant = "custom",
  size = 20,
  className,
  svgProps,
}: IComponentProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      width={size}
      height={size}
      className={twMerge("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      data-module="shared"
      data-model="icon"
      data-variant={variant}
      data-icon-name={name}
      dangerouslySetInnerHTML={{
        __html: icons[name]
          .replace(/<svg[^>]*>/, "")
          .replace(/<\/svg>\s*$/, ""),
      }}
    />
  );
}
