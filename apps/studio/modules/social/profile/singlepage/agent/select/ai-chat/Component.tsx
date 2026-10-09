"use client";
import { useState } from "react";
import {
  Select,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IProjectAgent } from "../../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import {
  Component as AgentProfile,
  knowledgeAgent,
} from "../../overview/ai-chat/index";
import { Component as AgentAvatar } from "../../avatar/ai-chat/index";
export interface IThreadAgentSelectProps {
  onChange: (selected: boolean) => void;
}
export function Component({ onChange }: IThreadAgentSelectProps) {
  const [agentId, setAgentId] = useState("");
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  return (
    <fieldset
      data-ds-block="social.profile.agent-select-ai-chat"
      className="min-w-0 space-y-3"
    >
      <legend className={kit.label}>Agent</legend>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            aria-label="Thread agent"
            placeholder="Select an agent"
            value={agentId}
            onValueChange={(value) => {
              setAgentId(value);
              onChange(value === knowledgeAgent.id);
            }}
            options={[{ value: knowledgeAgent.id, label: knowledgeAgent.name }]}
          />
        </div>
        {agentId && (
          <AgentAvatar agent={knowledgeAgent} onSelect={setProfile} />
        )}
      </div>
      <p className="text-xs leading-5 text-sps-muted">
        {agentId
          ? knowledgeAgent.description
          : "Choose the agent for this conversation."}
      </p>
      <AgentProfile agent={profile} onClose={() => setProfile(null)} />
    </fieldset>
  );
}
