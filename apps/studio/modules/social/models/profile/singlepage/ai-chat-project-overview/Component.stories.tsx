import { Component as SocialModuleProfile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { ProfilesProvider } from "../ai-chat-project/Profiles";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <div className="@container min-h-screen bg-sps-grey font-sps text-sps-graphite">
          <SocialModuleProfile
            variant="ai-chat-project-overview"
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
  id: "modules-social-models-profile-singlepage-ai-chat-project-overview",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project-overview",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
