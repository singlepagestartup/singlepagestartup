import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-rbac-models-widget-singlepage-loading",
  title: "Modules/RBAC/Widget/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
export const WorkspaceLoading: StoryObj<typeof meta> = {
  args: {
    variant: "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  },
};
