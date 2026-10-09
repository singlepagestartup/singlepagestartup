import { Component as SocialModuleProfile } from "../../index";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { IAccountMenuProps } from "./Component";
import type { Meta, StoryObj } from "@storybook/react";
function Example(props: IAccountMenuProps) {
  return <SocialModuleProfile {...props} variant="account-menu" />;
}
const meta = {
  id: "modules-social-models-profile-singlepage-account-menu",
  title: "Modules/Social/Models/Profile/Singlepage/account-menu",
  component: Example,
  parameters: { layout: "centered" },
  args: { showTokens: false, data: aiChatAccount.profile },
  argTypes: { showTokens: { control: "boolean" } },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const AIChat: StoryObj<typeof meta> = { args: { showTokens: true } };
