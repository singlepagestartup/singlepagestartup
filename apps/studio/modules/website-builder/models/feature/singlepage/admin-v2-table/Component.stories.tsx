import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleFeature } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Feature/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleFeature,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleFeature>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
