import { useState } from "react";
import { Component } from "./index";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const project = aiChatProjectFixture();
  const [selected, setSelected] = useState("brief");
  const [open, setOpen] = useState(true);
  return (
    <div className="w-64 bg-sps-graphite p-4 text-white">
      <Component
        id="navigation-example"
        profileId={project.id}
        name={project.name}
        documents={project.documents}
        knowledge={projectKnowledge(project)}
        graph={projectThreadGraph(project)}
        documentListOpen={open}
        selectedDocument={selected}
        settingsSelected={false}
        canCreateThread={false}
        onSettings={() => {}}
        onToggleDocuments={() => setOpen(!open)}
        onDocument={setSelected}
        onThread={() => {}}
        onCreateThread={() => {}}
      />
    </div>
  );
}

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-navigation",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-navigation",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
