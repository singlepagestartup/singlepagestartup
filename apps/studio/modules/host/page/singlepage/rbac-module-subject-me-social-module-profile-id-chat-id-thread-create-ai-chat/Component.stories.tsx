import { AIChatPreview, type IAIChatPreviewProps } from "../ai-chat/Preview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<
  IAIChatPreviewProps,
  "signedIn" | "account" | "profiles" | "workspaceState"
>;
function Component(props: IPageStoryProps) {
  return (
    <AIChatPreview
      {...props}
      initialHref="/ai-chat/social/profiles/pottery/chats/pottery%3Aproject-chat/threads/create"
    />
  );
}
const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: {
    signedIn: true,
    workspaceState: "ready",
    account: aiChatAccount,
    profiles: aiChatWorkspaceFixture(),
  },
  argTypes: {
    workspaceState: {
      control: "select",
      options: [
        "ready",
        "checking-session",
        "loading-projects",
        "loading-chat",
        "sign-in-required",
        "access-denied",
        "error",
      ],
    },
    signedIn: { control: "boolean" },
    account: { control: "object" },
    profiles: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

export const Guest: StoryObj<typeof meta> = {
  args: {
    workspaceState: "sign-in-required",
    signedIn: false,
    account: { balance: null },
  },
};
