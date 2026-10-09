import type { Meta, StoryObj } from "@storybook/react";
import { Component as RbacModuleIdentity } from "../../index";
import type { IProviderConnectProps } from "./Component";
function Example(props: IProviderConnectProps) {
  return <RbacModuleIdentity {...props} variant="provider-connect" />;
}
const meta = {
  title: "Modules/Rbac/Models/Identity/Singlepage/provider-connect",
  component: Example,
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
} satisfies Meta<typeof Example>;
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
