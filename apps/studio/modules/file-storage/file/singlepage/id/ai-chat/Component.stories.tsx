import { Component as File } from "../../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-file-storage-models-file-singlepage-id-ai-chat",
  title: "Modules/File-Storage/File/Singlepage/id/ai-chat",
  component: File,
  args: {
    variant: "id-ai-chat",
    file: {
      id: "catalog",
      name: "Products.txt",
      size: 24,
      mimeType: "text/plain",
      text: "Pottery workshop products",
    },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof File>, { variant: "id-ai-chat" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = { args: meta.args };
