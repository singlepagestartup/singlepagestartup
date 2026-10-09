import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CategoriesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Categories-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: CategoriesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CategoriesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
