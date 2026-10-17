import { Component as Subject } from "../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "storybook/test";
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
            variant="me-identity-change-email"
            identity={identity}
            onUpdate={setIdentity}
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-identity-change-email",
  title: "Modules/RBAC/Subject/Singlepage/me/identity/change-email",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Expanded: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Change email" }),
    );
  },
};
export const VerificationCode: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Change email" }));
    await userEvent.click(
      canvas.getByRole("button", { name: "Send verification code" }),
    );
  },
};
export const NewEmail: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Change email" }));
    await userEvent.click(
      canvas.getByRole("button", { name: "Send verification code" }),
    );
    await userEvent.type(canvas.getByLabelText("Verification code"), "123456");
    await userEvent.click(canvas.getByRole("button", { name: "Verify code" }));
  },
};
export const NewEmailVerification: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Change email" }));
    await userEvent.click(
      canvas.getByRole("button", { name: "Send verification code" }),
    );
    await userEvent.type(canvas.getByLabelText("Verification code"), "123456");
    await userEvent.click(canvas.getByRole("button", { name: "Verify code" }));
    await userEvent.type(canvas.getByLabelText("New email"), "new@example.com");
    await userEvent.click(
      canvas.getByRole("button", { name: "Verify new email" }),
    );
  },
};
