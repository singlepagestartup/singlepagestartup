import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "../../index";

const meta = {
  title:
    "Modules/CRM/Relations/Widgets-To-Website-Builder-Module-Widgets/Singlepage/admin-v2-table",
  component: WidgetsToWebsiteBuilderModuleWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToWebsiteBuilderModuleWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
