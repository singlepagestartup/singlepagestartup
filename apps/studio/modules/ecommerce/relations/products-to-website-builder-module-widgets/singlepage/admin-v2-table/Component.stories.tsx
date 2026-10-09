import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProductsToWebsiteBuilderModuleWidgets } from "../../index";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Products-To-Website-Builder-Module-Widgets/Singlepage/admin-v2-table",
  component: ProductsToWebsiteBuilderModuleWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProductsToWebsiteBuilderModuleWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
