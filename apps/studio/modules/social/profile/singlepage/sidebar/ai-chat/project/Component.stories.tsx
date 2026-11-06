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
          <div className="w-64 bg-default p-4 text-default-foreground">
            <Profile
              variant="sidebar-ai-chat-project"
              profileId="pottery"
              selected="products"
            />
          </div>
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-sidebar-ai-chat-project",
  title: "Modules/Social/Profile/Singlepage/sidebar/ai-chat/project",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
