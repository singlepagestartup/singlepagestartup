import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CategoriesToWebsiteBuilderModuleWidgets } from "../../index";

const meta = {
  title:
    "Modules/Blog/Relations/Categories-To-Website-Builder-Module-Widgets/Singlepage/admin-v2-table",
  component: CategoriesToWebsiteBuilderModuleWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CategoriesToWebsiteBuilderModuleWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
