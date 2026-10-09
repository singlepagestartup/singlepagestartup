import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OrdersToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Orders-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: OrdersToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof OrdersToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
