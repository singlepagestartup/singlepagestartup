import { Component as Subject } from "../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../account/Account";
import { aiChatAccount } from "../../../account/fixture";
import { ProfilesProvider } from "../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { ProjectProvider } from "../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <Subject
            variant="me-identity-create-telegram"
            onComplete={() => {}}
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-identity-create-telegram",
  title: "Modules/RBAC/Subject/Singlepage/me/identity/create/telegram",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
