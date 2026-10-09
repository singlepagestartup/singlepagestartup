import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FeaturesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Features-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: FeaturesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof FeaturesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
