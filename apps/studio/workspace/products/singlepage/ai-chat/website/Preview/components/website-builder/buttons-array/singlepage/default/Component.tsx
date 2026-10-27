import { forwardRef as forwardRef, type SVGProps as SVGProps } from "react";

import { twMerge as twMerge } from "tailwind-merge";
import IconGlyphs from "../../../feature/singlepage/icon/icons.json";
import { Component as WebsiteBuilderModuleButton } from "../../../button/index";
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
export interface ButtonsArrayItem {
  label: string;
  href: string;
  variant: "link" | "primary" | "secondary";
  icon?: ModuleIcon;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
  inverse?: boolean;
  target?: "_self" | "_top";
}
export interface ButtonsArrayDefaultProps {
  ariaLabel?: string;
  buttons: ButtonsArrayItem[];
  orientation?: "horizontal" | "vertical";
  title?: string;
}
export function ButtonsArrayDefault(props?: Partial<ButtonsArrayDefaultProps>) {
  const { ariaLabel, buttons, orientation, title } = {
    ...defaultButtonsArrayProps,
    ...props,
  };
  const layoutClass =
    orientation === "vertical"
      ? `flex min-w-0 flex-col items-start ${title ? "gap-0" : "gap-3"}`
      : "flex min-w-0 flex-wrap items-center gap-3";
  return (
    <div
      aria-label={ariaLabel}
      className={layoutClass}
      data-ds-block="website-builder.buttons-array.default"
      data-ds-layer="singlepage"
      role={ariaLabel ? "navigation" : undefined}
    >
      {title ? (
        <h3 className="mb-6 w-full text-base font-semibold leading-6 tracking-normal text-[var(--workspace-brand-foreground)]">
          {title}
        </h3>
      ) : null}
      {buttons.map((button) => {
        if (button.variant === "link") {
          return (
            <WebsiteBuilderModuleButton
              variant="link"
              href={button.href}
              target={button.target}
              key={`${button.variant}:${button.href}:${button.label}`}
              label={button.label}
              size={button.size}
              tone={button.tone}
            />
          );
        }
        return button.variant === "secondary" ? (
          <WebsiteBuilderModuleButton
            variant="secondary"
            href={button.href}
            target={button.target}
            inverse={button.inverse}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        ) : (
          <WebsiteBuilderModuleButton
            variant="primary"
            href={button.href}
            target={button.target}
            icon={button.icon}
            key={`${button.variant}:${button.href}:${button.label}`}
            label={button.label}
          />
        );
      })}
    </div>
  );
}
const Play = createIcon("play");
const ArrowRight = createIcon("arrow-right");
export const defaultButtonsArrayProps: ButtonsArrayDefaultProps = {
  buttons: [
    {
      label: "Открыть панель управления",
      href: "/admin",
      variant: "primary",
      icon: ArrowRight,
    },
    {
      label: "Подробнее",
      href: "#features",
      variant: "secondary",
      icon: Play,
    },
  ] satisfies ButtonsArrayItem[],
};
