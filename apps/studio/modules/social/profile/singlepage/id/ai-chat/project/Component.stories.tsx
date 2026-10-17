import { Component as Profile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/me/account/Account";
import { ProfilesProvider } from "../../../scope/ai-chat/project/Profiles";
import { aiChatAccount } from "../../../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../scope/ai-chat/project/fixtures";
function Component() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <div className="@container min-h-screen bg-muted font-default text-foreground">
          <Profile
            variant="id-ai-chat-project"
            profileId="pottery"
            selected="products"
          >
            {(navigation) => (
              <div className="p-5">
                {navigation}Project profile content slot
              </div>
            )}
          </Profile>
        </div>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-id-ai-chat-project",
  title: "Modules/Social/Profile/Singlepage/id/ai-chat/project",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
