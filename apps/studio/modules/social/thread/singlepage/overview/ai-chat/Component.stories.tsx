import { Component as SocialModuleThread } from "../../../index";
import { Component as RbacModuleSubject } from "../../../../../rbac/subject/index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace @container/chat flex h-160 flex-col overflow-hidden bg-sps-white">
          <SocialModuleThread
            variant="overview-ai-chat"
            messageCreate={
              <RbacModuleSubject variant="message-create-ai-chat" />
            }
          />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}
const meta = {
  id: "modules-social-models-thread-singlepage-overview-ai-chat",
  title: "Modules/Social/Models/Thread/Singlepage/overview/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
