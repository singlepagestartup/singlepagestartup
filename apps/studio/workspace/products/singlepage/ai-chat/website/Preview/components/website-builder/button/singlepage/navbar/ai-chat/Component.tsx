import IconGlyphs from "../../../../feature/singlepage/icon/icons.json";
import { memo } from "react";
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
export interface IHeaderButtonProps {
  id: string;
  activeHref?: string;
  onNavigate?: () => void;
}
interface IHeaderButton {
  title: string;
  url: string;
  icon: IconName;
  target?: "_self";
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};
const buttons: Record<string, IHeaderButton> = {
  "ai-chat-try": {
    title: "Попробовать чат",
    url: "#workflow",
    icon: "play",
    target: "_self",
  },
  "ai-chat-help": { title: "Помощь", url: "/ai-chat/help", icon: "question" },
  "ai-chat-login": {
    title: "Войти",
    url: "/ai-chat/rbac/subjects/authentication/select-method",
    icon: "user-circle",
  },
  "ai-chat-register": {
    title: "Создать аккаунт",
    url: "/ai-chat/rbac/subjects/authentication/registration",
    icon: "user-circle",
  },
};
export const Component = memo(function Component({
  id,
  activeHref,
  onNavigate,
}: IHeaderButtonProps) {
  const data = buttons[id];
  if (!data) return null;
  const active = data.url === activeHref;
  return (
    <a
      data-ds-block="website-builder.button.navbar-ai-chat"
      data-module="website-builder"
      data-model="button"
      data-id={id}
      data-variant="navbar-ai-chat"
      href={data.url}
      target={data.target}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${kit.focus} ${active ? "bg-[color:var(--workspace-brand-foreground)] font-semibold text-white" : "text-[color:var(--workspace-brand-muted)] hover:bg-[color:var(--workspace-brand-background)]"}`}
    >
      <Icon name={data.icon} />
      {data.title}
    </a>
  );
});
