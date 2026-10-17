import { Component as Profile } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/me/account/Account";
import { ProfilesProvider } from "../../../scope/ai-chat/project/Profiles";
import { ProjectProvider } from "../../../scope/ai-chat/project/Profile";
import { aiChatAccount } from "../../../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../scope/ai-chat/project/fixtures";

function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <Profile variant="settings-ai-chat-project" profileId="pottery">
            <p className="text-sm text-muted-foreground">
              Subject profile settings action slot
            </p>
          </Profile>
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-settings-ai-chat-project",
  title: "Modules/Social/Profile/Singlepage/settings/ai-chat/project",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
