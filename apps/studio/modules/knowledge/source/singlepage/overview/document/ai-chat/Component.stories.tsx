import { Component as KnowledgeModuleSource } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "./Source";
import { aiChatSourceFixture } from "../../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  const { source, files, fileIds } = aiChatSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={source}
        initialFileIds={fileIds}
      >
        <div className="mx-auto max-w-xl p-4">
          <KnowledgeModuleSource variant="overview-document-ai-chat" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-overview-document-ai-chat",
  title: "Modules/Knowledge/Models/Source/Singlepage/overview/document/ai-chat",
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
