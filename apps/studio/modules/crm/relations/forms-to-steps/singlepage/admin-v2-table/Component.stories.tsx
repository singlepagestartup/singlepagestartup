import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FormsToSteps } from "../../index";

const meta = {
  title: "Modules/CRM/Relations/Forms-To-Steps/Singlepage/admin-v2-table",
  component: FormsToSteps,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof FormsToSteps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
