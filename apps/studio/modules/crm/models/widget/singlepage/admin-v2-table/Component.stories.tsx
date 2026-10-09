import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleWidget } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Widget/Singlepage/admin-v2-table",
  component: CrmModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CrmModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
