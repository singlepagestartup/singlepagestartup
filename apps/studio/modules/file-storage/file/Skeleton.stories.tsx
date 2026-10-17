import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-file-storage-models-file-singlepage-loading",
  title: "Modules/File-Storage/File/Singlepage/Loading",
  component: Component,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
export const PreviewLoading: StoryObj<typeof meta> = {
  args: { variant: "id-ai-chat" },
};
