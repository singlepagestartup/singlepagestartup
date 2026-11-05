import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../index";
import type { IProviderConnectProps } from "./interface";
function Component(props: IProviderConnectProps) {
  return (
    <Subject {...props} variant="me-authentication-provider-connect-default" />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-authentication-provider-connect-default",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/provider-connect/default",
  component: Component,
  args: { provider: "oauth_google" },
  argTypes: {
    provider: {
      control: "select",
      options: [
        "email_and_password",
        "oauth_google",
        "telegram",
        "ethereum_virtual_machine",
      ],
    },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Google: StoryObj<typeof meta> = {};
export const Telegram: StoryObj<typeof meta> = {
  args: { provider: "telegram" },
};
export const Wallet: StoryObj<typeof meta> = {
  args: { provider: "ethereum_virtual_machine" },
};

export const Email: StoryObj<typeof meta> = {
  args: { provider: "email_and_password" },
};
