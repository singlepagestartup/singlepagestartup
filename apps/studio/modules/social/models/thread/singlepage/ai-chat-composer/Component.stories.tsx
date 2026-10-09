import { Component } from "./index";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [value, setValue] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [project] = useState(aiChatProjectFixture);
  const document = project.documents[0];
  const graph = projectKnowledge(project);
  const sources = graph.sources.filter((source) =>
    graph.bundles[0].sourceSlugs.includes(source.slug),
  );
  const [files, setFiles] = useState<
    import("../../../../../../workspace/utils/products/ai-chat-workspace").IProjectFile[]
  >([]);
  return (
    <Component
      value={value}
      onChange={setValue}
      onSend={() => {
        setValue("");
        setFiles([]);
      }}
      files={files}
      onFiles={(next) => setFiles((current) => [...current, ...next])}
      onRemoveFile={(id) =>
        setFiles((current) => current.filter((file) => file.id !== id))
      }
      label="Message the AI agent"
      knowledge={{
        title: document.title,
        sources,
        selectedSourceIds: sections,
        onChange: setSections,
      }}
      placeholder="What would you like to work on?"
    />
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-composer",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-composer",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
