import { Component as SocialModuleProfile } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/account/Account";
import { ProfilesProvider } from "../../scope/ai-chat/Profiles";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <div className="@container min-h-screen bg-sps-grey font-sps text-sps-graphite">
          <SocialModuleProfile
            variant="project-overview-ai-chat"
            profileId="pottery"
            selected="products"
          >
            {(navigation) => (
              <div className="p-5">
                {navigation}Project profile content slot
              </div>
            )}
          </SocialModuleProfile>
        </div>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-project-overview-ai-chat",
  title: "Modules/Social/Models/Profile/Singlepage/project/overview/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
