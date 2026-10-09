import { Component as FileStorageModuleFile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  id: "modules-file-storage-models-file-singlepage-ai-chat-preview",
  title: "Modules/File-Storage/Models/File/Singlepage/ai-chat-preview",
  component: FileStorageModuleFile,
  args: {
    variant: "ai-chat-preview",
    file: {
      id: "catalog",
      name: "Products.txt",
      size: 24,
      mimeType: "text/plain",
      text: "Pottery workshop products",
    },
  },
} satisfies Meta<typeof FileStorageModuleFile>;
export default meta;
export const Default: StoryObj<typeof meta> = { args: meta.args };
