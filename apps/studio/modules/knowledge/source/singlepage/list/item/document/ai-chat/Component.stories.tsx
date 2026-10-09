import { Component as KnowledgeModuleSource } from "../../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../overview/document/ai-chat/Source";
import { aiChatSourceFixture } from "../../../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  const { source, files, fileIds } = aiChatSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={source}
        initialFileIds={fileIds}
      >
        <div className="w-64 bg-sps-graphite p-4">
          <KnowledgeModuleSource
            variant="list-item-document-ai-chat"
            selected
            href="/ai-chat/projects/pottery"
          />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-list-item-document-ai-chat",
  title:
    "Modules/Knowledge/Models/Source/Singlepage/list/item/document/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
