import { memo } from "react";
import {
  Icon,
  kit,
  type IconName,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

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
const buttons: Record<string, IHeaderButton> = {
  "ai-chat-try": {
    title: "Try the chat",
    url: "#workflow",
    icon: "play",
    target: "_self",
  },
  "ai-chat-help": { title: "Help", url: "/ai-chat/help", icon: "question" },
  "ai-chat-login": {
    title: "Sign in",
    url: "/ai-chat/login",
    icon: "user-circle",
  },
  "ai-chat-register": {
    title: "Create account",
    url: "/ai-chat/register",
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
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${kit.focus} ${active ? "bg-sps-graphite font-semibold text-white" : "text-sps-muted hover:bg-sps-grey"}`}
    >
      <Icon name={data.icon} />
      {data.title}
    </a>
  );
});
