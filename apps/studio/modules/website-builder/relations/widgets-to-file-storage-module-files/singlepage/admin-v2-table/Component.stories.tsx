import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Widgets-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: WidgetsToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
