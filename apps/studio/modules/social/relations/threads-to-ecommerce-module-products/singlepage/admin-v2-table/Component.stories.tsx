import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ThreadsToEcommerceModuleProducts } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Threads-To-Ecommerce-Module-Products/Singlepage/admin-v2-table",
  component: ThreadsToEcommerceModuleProducts,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ThreadsToEcommerceModuleProducts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
