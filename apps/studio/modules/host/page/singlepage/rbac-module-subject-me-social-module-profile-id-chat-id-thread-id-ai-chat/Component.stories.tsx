import { AIChatPreview, type IAIChatPreviewProps } from "../ai-chat/Preview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { aiChatWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import { ProjectProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
import { aiChatAttachmentWorkspaceFixture } from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<
  IAIChatPreviewProps,
  | "signedIn"
  | "account"
  | "profiles"
  | "workspaceState"
  | "workspaceErrorMessage"
  | "onRetry"
> & { withAttachments?: boolean };
function Component({ withAttachments = false, ...props }: IPageStoryProps) {
  return (
    <ProjectProvider
      key={String(withAttachments)}
      profileId="pottery"
      preview={withAttachments ? aiChatAttachmentWorkspaceFixture() : undefined}
    >
      <AIChatPreview
        {...props}
        initialHref="/ai-chat/social/profiles/pottery"
      />
    </ProjectProvider>
  );
}
const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
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
    workspaceErrorMessage: { control: "text" },
    onRetry: { action: "retry", control: false },
    signedIn: { control: "boolean" },
    account: { control: "object" },
    profiles: { control: "object" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const CheckingSession: StoryObj<typeof meta> = {
  args: {
    workspaceState: "checking-session",
    signedIn: false,
    account: { balance: null },
  },
};
export const LoadingProjects: StoryObj<typeof meta> = {
  args: { workspaceState: "loading-projects" },
};
export const LoadingChat: StoryObj<typeof meta> = {
  args: { workspaceState: "loading-chat" },
};
export const SignInRequired: StoryObj<typeof meta> = {
  args: {
    workspaceState: "sign-in-required",
    signedIn: false,
    account: { balance: null },
  },
};
export const AccessDenied: StoryObj<typeof meta> = {
  args: { workspaceState: "access-denied" },
};
export const LoadError: StoryObj<typeof meta> = {
  args: { workspaceState: "error" },
};

export const WithAttachments: StoryObj<typeof meta> = {
  args: { withAttachments: true },
};

// Preserve old bookmarks without listing a second guest example in the sidebar.
export const Guest: StoryObj<typeof meta> = {
  ...SignInRequired,
  tags: ["!dev", "!autodocs"],
};
