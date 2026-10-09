import { Component as HostModuleLayout } from "../../index";
import { Component as SocialModuleProfile } from "../../../../../social/models/profile/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

import { ProfilesProvider } from "../../../../../social/models/profile/singlepage/ai-chat-project/Profiles";

import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <HostModuleLayout
      variant="ai-chat-header"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile
          variant="ai-chat-project-select"
          profileId="pottery"
          {...props}
        />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="ai-chat-account"
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
  id: "modules-host-models-layout-singlepage-ai-chat-header",
  title: "Modules/Host/Models/Layout/Singlepage/ai-chat-header",
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
