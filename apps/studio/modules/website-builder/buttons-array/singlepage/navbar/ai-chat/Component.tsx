import type { IComponentProps, IHeaderButtonsProps } from "./interface";
export type { IHeaderButtonsProps } from "./interface";
import { Component as Button } from "../../../../button/index";

const buttonIds: Record<string, string> = {
  "ai-chat-try": "ai-chat-try",
  "ai-chat-help": "ai-chat-help",
  "ai-chat-login": "ai-chat-login",
  "ai-chat-register": "ai-chat-register",
};
export function Component({
  variant = "navbar-ai-chat",
  id,
  activeHref,
  onNavigate,
}: IComponentProps) {
  const buttonId = buttonIds[id];
  if (!buttonId) return null;
  return (
    <div
      data-ds-block="website-builder.buttons-array.navbar-ai-chat"
      data-id={id}
      className="flex items-center gap-1"
      data-module="website-builder"
      data-model="buttons-array"
      data-variant={variant}
    >
      <Button
        variant="navbar-ai-chat"
        id={buttonId}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
    </div>
  );
}
