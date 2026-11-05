import { Component as Layout } from "../../index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { ProfilesProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";

import { AccountProvider } from "../../../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return (
    <Layout
      variant="ai-chat-dashboard"
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
          variant="me-account"
          showTokens
          page="chat"
          onNavigate={onNavigate}
        />
      )}
    >
      <main className="mx-auto max-w-6xl p-5">Page content slot</main>
    </Layout>
  );
}
const meta = {
  id: "modules-host-models-layout-singlepage-ai-chat-dashboard",
  title: "Modules/Host/Layout/Singlepage/ai-chat-dashboard",
  component: Component,
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
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
