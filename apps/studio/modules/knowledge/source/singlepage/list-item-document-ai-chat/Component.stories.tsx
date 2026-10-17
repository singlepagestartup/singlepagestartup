import { Component as Source } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../id/ai-chat/Source";
import { aiChatSourceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
function Component() {
  const { source, files, fileIds } = aiChatSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={source}
        initialFileIds={fileIds}
      >
        <div className="w-64 bg-default p-4">
          <Source
            variant="list-item-document-ai-chat"
            selected
            href="/ai-chat/social/profiles/pottery"
          />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-list-item-document-ai-chat",
  title: "Modules/Knowledge/Source/Singlepage/list-item-document-ai-chat",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
