import { Component as HostModuleLayout } from "../../../index";
import { Component as SocialModuleProfile } from "../../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/subject/index";

import { ProfilesProvider } from "../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";

import { AccountProvider } from "../../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <HostModuleLayout
      variant="service-ai-chat"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile
          profileId="pottery"
          {...props}
          variant="select-ai-chat-project"
        />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="chat"
          onNavigate={onNavigate}
        />
      )}
    >
      <main className="mx-auto max-w-6xl p-5">Page content slot</main>
    </HostModuleLayout>
  );
}
const meta = {
  id: "modules-host-models-layout-singlepage-service-ai-chat",
  title: "Modules/Host/Models/Layout/Singlepage/service/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <ProfilesProvider {...aiChatWorkspaceFixture()}>
          <Story />
        </ProfilesProvider>
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
