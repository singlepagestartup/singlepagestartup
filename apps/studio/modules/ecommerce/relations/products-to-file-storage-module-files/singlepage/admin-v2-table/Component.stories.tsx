import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProductsToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Products-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: ProductsToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProductsToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
