import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as LogotypesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Logotypes-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: LogotypesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof LogotypesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
