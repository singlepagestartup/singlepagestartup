import { Component } from "./index";
import { useState } from "react";
import { aiChatSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const fixture = aiChatSourceFixture();
  const section = fixture.documents[0].sections[0].title;
  const [assets, setAssets] = useState(fixture.documents[0].assets ?? []);
  const [sources, setSources] = useState(fixture.sources);
  return (
    <Component
      section={section}
      assets={assets}
      sources={sources}
      onAttach={(file) =>
        setAssets((current) => [
          ...current,
          { id: `${section}:${file.id}`, section, file },
        ])
      }
      onUpload={(files) => {
        setSources((current) => [...current, ...files]);
        setAssets((current) => [
          ...current,
          ...files.map((file) => ({
            id: `${section}:${file.id}`,
            section,
            file,
          })),
        ]);
      }}
      onRemove={(fileId) =>
        setAssets((current) =>
          current.filter((asset) => asset.file.id !== fileId),
        )
      }
    />
  );
}

const meta = {
  id: "modules-file-storage-models-file-singlepage-ai-chat-attachments",
  title: "Modules/File-Storage/Models/File/Singlepage/ai-chat-attachments",
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
