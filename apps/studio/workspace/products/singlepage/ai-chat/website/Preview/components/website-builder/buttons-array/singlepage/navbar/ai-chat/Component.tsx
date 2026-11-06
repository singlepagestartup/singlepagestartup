import { Component as WebsiteBuilderModuleButton } from "../../../../button/index";

export interface IHeaderButtonsProps {
  id: string;
  activeHref?: string;
  onNavigate?: () => void;
}
const buttonIds: Record<string, string> = {
  "ai-chat-try": "ai-chat-try",
  "ai-chat-help": "ai-chat-help",
  "ai-chat-login": "ai-chat-login",
  "ai-chat-register": "ai-chat-register",
};
export function Component({ id, activeHref, onNavigate }: IHeaderButtonsProps) {
  const buttonId = buttonIds[id];
  if (!buttonId) return null;
  return (
    <div
      data-ds-block="website-builder.buttons-array.navbar-ai-chat"
      data-module="website-builder"
      data-model="buttons-array"
      data-id={id}
      data-variant="navbar-ai-chat"
      className="flex items-center gap-1"
    >
      <WebsiteBuilderModuleButton
        variant="navbar-ai-chat"
        id={buttonId}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
    </div>
  );
}
