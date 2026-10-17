import { useArgs } from "storybook/preview-api";
import { AIChatPreview, type IAIChatPreviewProps } from "../ai-chat/Preview";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import type { Meta, StoryObj } from "@storybook/react";
type IPageStoryProps = Pick<
  IAIChatPreviewProps,
  | "signedIn"
  | "account"
  | "profiles"
  | "projectsState"
  | "creatingProject"
  | "onCreatingProjectChange"
>;
function Component(props: IPageStoryProps) {
  return <AIChatPreview {...props} initialHref="/ai-chat/projects" />;
}
const meta = {
  id: "modules-host-models-page-singlepage-rbac-module-subject-me-social-module-profile-list-ai-chat",
  title:
    "Modules/Host/Page/Singlepage/rbac-module-subject-me-social-module-profile-list-ai-chat",
  component: Component,
  render: function Render(props) {
    const [, updateArgs] = useArgs();
    return (
      <Component
        {...props}
        onCreatingProjectChange={(creatingProject) =>
          updateArgs({ creatingProject })
        }
      />
    );
  },
  parameters: { layout: "fullscreen" },
  args: {
    signedIn: true,
    account: aiChatAccount,
    projectsState: "ready",
    profiles: {
      initialProjects: [
        {
          id: "pottery",
          name: "Pottery workshops",
          variant: "scope-ai-chat-project",
        },
        { id: "coffee", name: "Coffee shop", variant: "scope-ai-chat-project" },
        {
          id: "design",
          name: "Design studio",
          variant: "scope-ai-chat-project",
        },
      ],
    },
  },
  argTypes: {
    signedIn: { control: "boolean" },
    profiles: { control: "object" },
    projectsState: {
      control: "select",
      options: ["ready", "sign-in-required"],
    },
    creatingProject: { control: "boolean" },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = {
  args: { profiles: { initialProjects: [] } },
};
export const Loading: StoryObj<typeof meta> = {
  args: { profiles: { initialProjects: [], loading: true } },
};
export const Error: StoryObj<typeof meta> = {
  args: { profiles: { initialProjects: [], error: true } },
};
export const Guest: StoryObj<typeof meta> = {
  args: { signedIn: false, projectsState: "sign-in-required" },
};
export const Creating: StoryObj<typeof meta> = {
  args: { creatingProject: true },
};
