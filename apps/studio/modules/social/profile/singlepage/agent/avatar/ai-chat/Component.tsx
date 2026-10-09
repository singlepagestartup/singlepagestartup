"use client";
import type { IProjectAgent } from "../../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import {
  Icon,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
export interface IAgentAvatarProps {
  agent: IProjectAgent;
  onSelect: (agent: IProjectAgent) => void;
}
export function Component({ agent, onSelect }: IAgentAvatarProps) {
  return (
    <button
      type="button"
      data-ds-block="social.profile.agent-avatar-ai-chat"
      data-module="social"
      data-model="profile"
      data-id={agent.id}
      data-variant="agent-avatar-ai-chat"
      onClick={() => onSelect(agent)}
      aria-label={`About ${agent.name}`}
      title={`About ${agent.name}`}
      className={`grid size-8 shrink-0 place-items-center rounded-lg bg-sps-green text-sps-graphite transition hover:bg-sps-green/80 ${kit.focus}`}
    >
      <Icon name="robot" className="size-4" />
    </button>
  );
}
