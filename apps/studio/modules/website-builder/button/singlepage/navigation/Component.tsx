import type { IComponentProps, INavigationButtonProps } from "./interface";
export type { INavigationButtonProps } from "./interface";
import { memo, type HTMLAttributeAnchorTarget } from "react";

export const Component = memo(function Component({
  variant = "navigation",
  label = "Home",
  href = "/",
  target,
  selected = false,
  disabled = false,
  onNavigate,
}: IComponentProps = {}) {
  const className = `inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium no-underline transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
    disabled
      ? "cursor-not-allowed text-muted-foreground"
      : selected
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
  return disabled ? (
    <span
      data-ds-block="website-builder.button.navigation"
      aria-disabled="true"
      className={className}
      data-module="website-builder"
      data-model="button"
      data-variant={variant}
    >
      {label}
    </span>
  ) : (
    <a
      data-ds-block="website-builder.button.navigation"
      href={href}
      target={target}
      aria-current={selected ? "page" : undefined}
      className={className}
      onClick={onNavigate}
      data-module="website-builder"
      data-model="button"
      data-variant={variant}
    >
      {label}
    </a>
  );
});
