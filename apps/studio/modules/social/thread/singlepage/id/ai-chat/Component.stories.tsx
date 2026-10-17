import { Component as Thread } from "../../../index";
import { Component as RbacModuleSubject } from "../../../../../rbac/subject/index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../../../../../knowledge/source/singlepage/id/ai-chat/Source";

function Component() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace @container/chat flex h-160 flex-col overflow-hidden bg-card">
          <Thread
            variant="id-ai-chat"
            messageCreate={
              <RbacModuleSubject variant="me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat" />
            }
          />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}
const meta = {
  id: "modules-social-models-thread-singlepage-id-ai-chat",
  title: "Modules/Social/Thread/Singlepage/id/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
