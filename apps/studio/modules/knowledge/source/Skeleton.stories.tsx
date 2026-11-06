import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-knowledge-models-source-singlepage-loading",
  title: "Modules/Knowledge/Source/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
export const DocumentLoading: StoryObj<typeof meta> = {
  args: { variant: "id-ai-chat" },
};
