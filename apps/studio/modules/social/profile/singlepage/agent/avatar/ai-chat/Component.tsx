"use client";
import type { IComponentProps, IAgentAvatarProps } from "./interface";
export type { IAgentAvatarProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import type { IProjectAgent } from "../../id/ai-chat/resolver";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "agent-avatar-ai-chat",
  agent,
  onSelect,
}: IComponentProps) {
  return (
    <button
      type="button"
      data-ds-block="social.profile.agent-avatar-ai-chat"
      data-id={agent.id}
      onClick={() => onSelect(agent)}
      aria-label={`О помощнике ${agent.name}`}
      title={`О помощнике ${agent.name}`}
      className={`grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/80 ${kit.focus}`}
      data-module="social"
      data-model="profile"
      data-variant={variant}
    >
      <Icon name="robot" className="size-4" />
    </button>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
