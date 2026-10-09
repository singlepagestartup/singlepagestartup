import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SlidesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Slides-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: SlidesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SlidesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
