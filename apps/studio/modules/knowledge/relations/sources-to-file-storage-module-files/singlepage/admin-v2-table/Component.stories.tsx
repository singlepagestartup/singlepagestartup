import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SourcesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Knowledge/Relations/Sources-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: SourcesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SourcesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
