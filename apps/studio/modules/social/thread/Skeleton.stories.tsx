import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-social-models-thread-singlepage-loading",
  title: "Modules/Social/Thread/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
export const ConversationLoading: StoryObj<typeof meta> = {
  args: { variant: "id-ai-chat" },
};
