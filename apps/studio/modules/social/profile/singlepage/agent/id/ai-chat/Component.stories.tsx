import { useState } from "react";
import { documentAgent, type IProjectAgent } from "./resolver";
import {
  Component as AgentProfile,
  ProjectAgentPicker,
  knowledgeAgent,
} from "./index";
import { Component as KnowledgeModuleSource } from "../../../../../../knowledge/source/index";
import type { Meta, StoryObj } from "@storybook/react";

function Component() {
  const [agent, setAgent] = useState<IProjectAgent | null>(
    documentAgent("strategy"),
  );
  const [agents, setAgents] = useState<IProjectAgent[]>([]);
  return (
    <div className="@container min-h-screen bg-muted p-8 font-default text-foreground">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6">
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
  id: "modules-social-models-profile-singlepage-agent-id-ai-chat",
  title: "Modules/Social/Profile/Singlepage/agent/id/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

// Profile knowledge includes sections from different document threads.
function ProfileKnowledgePreview() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-muted p-8 font-default text-foreground">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-card px-4 py-3"
      >
        About this assistant
      </button>
      <AgentProfile
        agent={open ? knowledgeAgent : null}
        onClose={() => setOpen(false)}
        knowledgeCount={3}
        knowledge={[
          {
            id: "brief-business",
            title: "Business brief",
            content: "Weekend pottery workshops for small groups.",
            slug: "brief-business",
            variant: "id-ai-chat",
          },
          {
            id: "products-workshops",
            title: "Products",
            content: "A guided workshop where each participant makes a cup.",
            slug: "products-workshops",
            variant: "id-ai-chat",
          },
          {
            id: "products-bookings",
            title: "Bookings",
            content:
              "Reserve a place in advance. Check the workshop date and group size.",
            slug: "products-bookings",
            variant: "id-ai-chat",
          },
        ].map((source) => (
          <KnowledgeModuleSource
            key={source.id}
            variant="id-sidebar-ai-chat"
            data={source}
          />
        ))}
      />
    </div>
  );
}
export const ProfileKnowledge: StoryObj<typeof meta> = {
  render: () => <ProfileKnowledgePreview />,
};

import { Component as Skill } from "../../../../../../social/skill";
function DocumentSkillsPreview() {
  const [open, setOpen] = useState(true);
  const documents = ["brief", "strategy", "brand", "design", "products"];
  return (
    <div className="min-h-screen bg-muted p-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-card px-4 py-3"
      >
        About this assistant
      </button>
      <AgentProfile
        agent={open ? knowledgeAgent : null}
        onClose={() => setOpen(false)}
        skillsCount={5}
        skills={documents.map((document) => {
          const profession = documentAgent(document);
          return (
            <Skill
              key={document}
              variant="id-ai-chat"
              data={{
                id: `example-${document}-skill`,
                slug: `ai-chat-${profession.id}-11111111-1111-4111-8111-111111111111`,
                title: profession.name,
                adminTitle: profession.name,
                description: profession.role,
                variant: "id-ai-chat",
              }}
            />
          );
        })}
      />
    </div>
  );
}
export const DocumentSkills: StoryObj<typeof meta> = {
  render: () => <DocumentSkillsPreview />,
};
