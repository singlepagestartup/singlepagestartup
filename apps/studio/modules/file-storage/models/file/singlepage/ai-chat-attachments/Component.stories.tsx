import { Component } from "./index";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [assets, setAssets] = useState(
    aiChatProjectFixture().documents[0].assets ?? [],
  );
  return (
    <Component
      section="Supplied material"
      assets={assets}
      sources={[]}
      onAttach={() => {}}
      onUpload={() => {}}
      onChange={(id, update) =>
        setAssets((current) =>
          current.map((asset) =>
            asset.id === id ? { ...asset, ...update } : asset,
          ),
        )
      }
      onRemove={(id) =>
        setAssets((current) => current.filter((asset) => asset.id !== id))
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
