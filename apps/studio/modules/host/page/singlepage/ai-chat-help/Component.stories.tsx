import { AIChatPreview, type IAIChatPreviewProps } from "../ai-chat/Preview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<
  IAIChatPreviewProps,
  "signedIn" | "account" | "profiles"
>;
function Component(props: IPageStoryProps) {
  return <AIChatPreview {...props} initialHref="/ai-chat/help" />;
}
const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-help",
  title: "Modules/Host/Page/Singlepage/ai-chat-help",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    signedIn: true,
    account: aiChatAccount,
    profiles: aiChatWorkspaceFixture(),
  },
  argTypes: {
    signedIn: { control: "boolean" },
    account: { control: "object" },
    profiles: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
