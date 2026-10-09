import { useState } from "react";
import {
  documentAgent,
  type IProjectAgent,
} from "../../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import { ProjectAgentPicker } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
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

const meta = {
  id: "modules-social-models-profile-singlepage-agent-overview-ai-chat",
  title: "Modules/Social/Models/Profile/Singlepage/agent/overview/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
