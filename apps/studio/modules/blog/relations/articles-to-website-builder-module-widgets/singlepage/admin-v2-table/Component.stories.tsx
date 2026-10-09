import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "../../index";

const meta = {
  title:
    "Modules/Blog/Relations/Articles-To-Website-Builder-Module-Widgets/Singlepage/admin-v2-table",
  component: ArticlesToWebsiteBuilderModuleWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ArticlesToWebsiteBuilderModuleWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
