import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ButtonsToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Buttons-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: ButtonsToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ButtonsToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
