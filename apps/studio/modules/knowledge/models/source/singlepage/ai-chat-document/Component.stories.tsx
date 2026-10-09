import { Component as KnowledgeModuleSource } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "./Source";
import { aiChatProductsSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  const { source, files, links } = aiChatProductsSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={source}
        initialFileLinks={links}
      >
        <div className="mx-auto max-w-xl p-4">
          <KnowledgeModuleSource variant="ai-chat-document" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-document",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-document",
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
