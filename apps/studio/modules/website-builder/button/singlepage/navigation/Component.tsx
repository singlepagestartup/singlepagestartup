import { memo, type HTMLAttributeAnchorTarget } from "react";

export interface INavigationButtonProps {
  label: string;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  selected?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
}

export const Component = memo(function Component({
  label = "Home",
  href = "/",
  target,
  selected = false,
  disabled = false,
  onNavigate,
}: Partial<INavigationButtonProps> = {}) {
  const className = `inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium no-underline transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${
    disabled
      ? "cursor-not-allowed text-[var(--workspace-brand-muted)]"
      : selected
        ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
        : "text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)]"
  }`;
  return disabled ? (
    <span
      data-ds-block="website-builder.button.navigation"
      aria-disabled="true"
      className={className}
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
    >
      {label}
    </a>
  );
});
