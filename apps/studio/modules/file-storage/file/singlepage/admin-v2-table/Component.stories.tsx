import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FileStorageModuleFile } from "../../index";

const meta = {
  title: "Modules/File-Storage/Models/File/Singlepage/admin-v2-table",
  component: FileStorageModuleFile,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof FileStorageModuleFile>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
