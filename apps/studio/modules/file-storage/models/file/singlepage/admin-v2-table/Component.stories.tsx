import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FileStorageModuleFile } from "../../index";

const meta = {
  title: "Modules/File-Storage/Models/File/Singlepage/admin-v2-table",
  component: FileStorageModuleFile,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof FileStorageModuleFile>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
