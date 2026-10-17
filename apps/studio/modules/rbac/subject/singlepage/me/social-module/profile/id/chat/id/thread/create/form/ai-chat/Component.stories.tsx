import { Component as Subject } from "../../../../../../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../../../../account/Account";
import { aiChatAccount } from "../../../../../../../../../account/fixture";
import { ProfilesProvider } from "../../../../../../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../../../../../../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { ProjectProvider } from "../../../../../../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <Subject
            variant="me-social-module-profile-id-chat-id-thread-create-form-ai-chat"
            profileId="pottery"
            chatId="pottery:project-chat"
            cancelHref="/ai-chat/social/profiles/pottery"
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-social-module-profile-id-chat-id-thread-create-form-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/me/social-module/profile/id/chat/id/thread/create/form/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
