import { Component as Widget } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../subject/singlepage/me/account/fixture";
import { ProfilesProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { ProjectProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <Widget
            variant="subject-me-social-module-profile-id-settings-ai-chat"
            profileId="pottery"
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-social-module-profile-id-settings-ai-chat",
  title:
    "Modules/RBAC/Widget/Singlepage/subject-me-social-module-profile-id-settings-ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
