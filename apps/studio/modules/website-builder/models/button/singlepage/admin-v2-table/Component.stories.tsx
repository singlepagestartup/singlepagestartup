import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleButton } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Button/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleButton,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
