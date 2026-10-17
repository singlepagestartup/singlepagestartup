import { Component as File } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-file-storage-models-file-singlepage-list-item-pending-ai-chat",
  title: "Modules/File-Storage/File/Singlepage/list-item-pending-ai-chat",
  component: File,
  args: {
    variant: "list-item-pending-ai-chat",
    file: {
      id: "catalog",
      name: "Products.txt",
      size: 24,
      mimeType: "text/plain",
      text: "Pottery workshop products",
    },
    onRemove: () => undefined,
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof File>,
    { variant: "list-item-pending-ai-chat" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = { args: meta.args };

export const Image: StoryObj<typeof meta> = {
  args: {
    file: {
      id: "reference",
      name: "Workshop reference.jpg",
      size: 342 * 1024,
      text: "",
      mimeType: "image/jpeg",
      fileUrl:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png",
    },
    onMove: () => undefined,
    onReorder: () => undefined,
    first: true,
  },
};
export const Sending: StoryObj<typeof meta> = {
  ...Image,
  args: { ...Image.args, disabled: true },
};
