import { Component as SocialModuleProfile } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { ProfilesProvider } from "../ai-chat-project/Profiles";
import { ProjectProvider } from "../ai-chat-project/Profile";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";

function Example() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <SocialModuleProfile
            variant="ai-chat-project-select"
            profileId="pottery"
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-project-select",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project-select",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
