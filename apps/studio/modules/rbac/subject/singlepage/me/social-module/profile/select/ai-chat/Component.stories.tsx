import { Component as Subject } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../account/Account";
import { aiChatAccount } from "../../../../account/fixture";
import { ProfilesProvider } from "../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { aiChatWorkspaceFixture } from "../../../../../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";

function Component({
  pending,
  empty,
  error,
}: {
  pending: boolean;
  empty: boolean;
  error: boolean;
}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <ProfilesProvider
        initialProjects={empty ? [] : aiChatWorkspaceFixture().initialProjects}
        loading={pending}
        error={error}
      >
        <div className="bg-card p-4 font-default text-foreground">
          <Subject
            variant="me-social-module-profile-select-ai-chat"
            profileId="pottery"
          />
        </div>
      </ProfilesProvider>
    </AccountProvider>
  );
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-social-module-profile-select-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/me/social-module/profile/select/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { pending: false, empty: false, error: false },
  argTypes: {
    pending: { control: "boolean" },
    empty: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Loading: StoryObj<typeof meta> = { args: { pending: true } };
export const Empty: StoryObj<typeof meta> = { args: { empty: true } };
export const Error: StoryObj<typeof meta> = { args: { error: true } };
