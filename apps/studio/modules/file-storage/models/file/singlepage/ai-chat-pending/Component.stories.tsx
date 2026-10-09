import { Component as FileStorageModuleFile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-file-storage-models-file-singlepage-ai-chat-pending",
  title: "Modules/File-Storage/Models/File/Singlepage/ai-chat-pending",
  component: FileStorageModuleFile,
  args: {
    variant: "ai-chat-pending",
    file: {
      id: "catalog",
      name: "Products.txt",
      size: 24,
      mimeType: "text/plain",
      text: "Pottery workshop products",
    },
    onRemove: () => undefined,
  },
} satisfies Meta<typeof FileStorageModuleFile>;
export default meta;
export const Default: StoryObj<typeof meta> = { args: meta.args };
