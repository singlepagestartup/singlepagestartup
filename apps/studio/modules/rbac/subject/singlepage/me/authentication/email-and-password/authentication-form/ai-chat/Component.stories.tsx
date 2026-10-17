import { Component as Subject } from "../../../../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../account/Account";
import { aiChatAccount } from "../../../../account/fixture";

function Component() {
  return (
    <Subject variant="me-authentication-email-and-password-authentication-form-ai-chat" />
  );
}

const meta = {
  id: "modules-rbac-models-subject-singlepage-me-authentication-email-and-password-authentication-form-ai-chat",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/email-and-password/authentication-form/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
