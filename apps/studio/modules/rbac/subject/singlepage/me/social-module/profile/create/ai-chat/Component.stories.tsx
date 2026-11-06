import { Component as Subject } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../account/Account";
import { aiChatAccount } from "../../../../account/fixture";
import { ProfilesProvider } from "../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
interface IStoryProps {
  pending: boolean;
  empty: boolean;
}
function Component({ pending, empty }: IStoryProps) {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider
        initialProjects={empty ? [] : aiChatWorkspaceFixture().initialProjects}
        loading={pending}
      >
        <Subject variant="me-social-module-profile-create-ai-chat" />
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-social-module-profile-create-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/me/social-module/profile/create/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { pending: false, empty: false },
  argTypes: {
    pending: { control: "boolean" },
    empty: { control: "boolean" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Loading: StoryObj<typeof meta> = { args: { pending: true } };
export const Empty: StoryObj<typeof meta> = { args: { empty: true } };
