import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-social-models-profile-singlepage-loading",
  title: "Modules/Social/Profile/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
export const ProjectLoading: StoryObj<typeof meta> = {
  args: { variant: "scope-ai-chat-project" },
};
