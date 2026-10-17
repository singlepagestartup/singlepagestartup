import { Component as Profile } from "../../index";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import type { IAccountMenuProps } from "./interface";
import type { Meta, StoryObj } from "@storybook/react";
function Component(props: IAccountMenuProps) {
  return <Profile {...props} variant="account-menu" />;
}
const meta = {
  id: "modules-social-models-profile-singlepage-account-menu",
  title: "Modules/Social/Profile/Singlepage/account-menu",
  component: Component,
  parameters: { layout: "centered" },
  args: { showTokens: false, data: aiChatAccount.profile },
  argTypes: { showTokens: { control: "boolean" } },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const AIChat: StoryObj<typeof meta> = { args: { showTokens: true } };
