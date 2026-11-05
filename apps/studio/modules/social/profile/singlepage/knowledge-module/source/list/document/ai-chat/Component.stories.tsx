import { Component as Profile } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../../../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
function Component() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <Profile
          variant="knowledge-module-source-list-document-ai-chat"
          onDiscuss={() => {}}
        />
      </SourceProvider>
    </FilesProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-knowledge-module-source-list-document-ai-chat",
  title:
    "Modules/Social/Profile/Singlepage/knowledge/source/list/document/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
