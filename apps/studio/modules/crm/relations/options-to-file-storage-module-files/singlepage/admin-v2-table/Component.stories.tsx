import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OptionsToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/CRM/Relations/Options-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: OptionsToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof OptionsToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
