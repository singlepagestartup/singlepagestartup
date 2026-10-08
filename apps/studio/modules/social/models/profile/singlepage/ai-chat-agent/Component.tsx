"use client";
import { useState } from "react";
import {
  documentAgent,
  type IProjectAgent,
} from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { ProjectAgentPicker } from "./View";
export function Component() {
  const [agent, setAgent] = useState<IProjectAgent | null>(
    documentAgent("strategy"),
  );
  const [agents, setAgents] = useState<IProjectAgent[]>([]);
  return (
    <div className="@container min-h-screen bg-sps-grey p-8 font-sps text-sps-graphite">
      <div className="mx-auto max-w-xl rounded-2xl border border-sps-line bg-sps-white p-6">
        <h1 className="mb-5 text-xl font-semibold">Thread agent</h1>
        <ProjectAgentPicker
          agent={agent}
          agents={agents}
          onChange={setAgent}
          onSave={(next) =>
            setAgents((current) => [
              ...current.filter((item) => item.id !== next.id),
              next,
            ])
          }
        />
      </div>
    </div>
  );
}
