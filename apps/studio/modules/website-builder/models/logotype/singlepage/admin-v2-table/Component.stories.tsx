import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleLogotype } from "../../index";

const meta = {
  title: "Modules/Website-Builder/Models/Logotype/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleLogotype,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleLogotype>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
