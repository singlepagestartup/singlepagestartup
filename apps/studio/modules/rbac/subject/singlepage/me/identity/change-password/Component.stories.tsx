import { Component as Subject } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../account/Account";
import { aiChatAccount } from "../../account/fixture";
import { ProfilesProvider } from "../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { ProjectProvider } from "../../../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
import { defaultSettingsIdentities } from "../../../../../shared";
import { useState } from "react";
function Component() {
  const [identity, setIdentity] = useState(defaultSettingsIdentities[0]);
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider profileId="pottery">
          <Subject
            variant="me-identity-change-password"
            identity={identity}
            onUpdate={setIdentity}
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-identity-change-password",
  title: "Modules/RBAC/Subject/Singlepage/me/identity/change-password",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

export const Expanded: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLButtonElement>("button[aria-expanded]")
      ?.click();
  },
};
