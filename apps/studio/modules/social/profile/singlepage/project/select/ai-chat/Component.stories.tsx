import { Component as SocialModuleProfile } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/account/Account";
import { ProfilesProvider } from "../../scope/ai-chat/Profiles";
import { ProjectProvider } from "../../scope/ai-chat/Profile";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../../workspace/utils/products/ai-chat-workspace-fixture";

function Example() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <SocialModuleProfile
            variant="project-select-ai-chat"
            profileId="pottery"
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-project-select-ai-chat",
  title: "Modules/Social/Models/Profile/Singlepage/project/select/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
