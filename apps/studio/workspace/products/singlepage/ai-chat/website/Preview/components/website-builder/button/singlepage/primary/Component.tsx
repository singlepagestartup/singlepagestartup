import { forwardRef as forwardRef, type SVGProps as SVGProps } from "react";

import { twMerge as twMerge } from "tailwind-merge";
import IconGlyphs from "../../../feature/singlepage/icon/icons.json";
type ModuleIcon = ReturnType<typeof createIcon>;
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "arrow-up-right"
  | "bank"
  | "bell"
  | "book-open"
  | "bookmark-simple"
  | "calendar-blank"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "chart-bar"
  | "chat"
  | "chat-circle"
  | "check"
  | "check-circle"
  | "clock"
  | "code"
  | "confetti"
  | "credit-card"
  | "cube"
  | "currency-circle-dollar"
  | "database"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "file-text"
  | "floppy-disk"
  | "folder-open"
  | "gear-six"
  | "github-logo"
  | "globe"
  | "google-chrome-logo"
  | "hash"
  | "house"
  | "image"
  | "key"
  | "lightning"
  | "link"
  | "link-break"
  | "linkedin-logo"
  | "list"
  | "lock-key"
  | "magnifying-glass"
  | "map-pin"
  | "megaphone"
  | "minus"
  | "monitor"
  | "newspaper"
  | "package"
  | "palette"
  | "paper-plane-tilt"
  | "paperclip"
  | "pencil-simple"
  | "phone"
  | "play"
  | "plus"
  | "push-pin"
  | "question"
  | "robot"
  | "share-network"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "sign-in"
  | "sign-out"
  | "smiley"
  | "squares-four"
  | "stack"
  | "star"
  | "tag"
  | "text-b"
  | "text-italic"
  | "thumbs-up"
  | "trash"
  | "trend-up"
  | "twitter-logo"
  | "upload-simple"
  | "user"
  | "user-circle"
  | "user-plus"
  | "users"
  | "wallet"
  | "warning"
  | "x";
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
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
    />
  );
}
export interface ButtonPrimaryProps {
  label: string;
  href: string;
  icon?: ModuleIcon;
  target?: "_self" | "_top";
}
export function ButtonPrimary(props?: Partial<ButtonPrimaryProps>) {
  const label = props?.label ?? defaultButtonPrimaryProps.label;
  const href = props?.href ?? defaultButtonPrimaryProps.href;
  const Icon = props?.icon ?? ArrowRight;
  return (
    <a
      className={`${kit.button} no-underline hover:brightness-95`}
      data-ds-block="website-builder.button.primary"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
    >
      {label}
      <Icon className="h-5 w-5 shrink-0" />
    </a>
  );
}
const ArrowRight = createIcon("arrow-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] enabled:hover:bg-[var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[var(--workspace-brand-muted)] enabled:hover:text-[var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-base text-[var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[var(--workspace-brand-muted)] focus-visible:border-[var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[var(--workspace-brand-background)] disabled:text-[var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[var(--workspace-brand-background)] aria-invalid:border-[var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5",
  muted: "text-[var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[var(--workspace-brand-foreground)]",
  focus: focus,
};
export const defaultButtonPrimaryProps: ButtonPrimaryProps = {
  label: "Открыть панель управления",
  href: "/admin",
  icon: ArrowRight,
};
