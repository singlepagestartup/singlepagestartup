import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FormsToRequests } from "../../index";

const meta = {
  title: "Modules/CRM/Relations/Forms-To-Requests/Singlepage/admin-v2-table",
  component: FormsToRequests,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof FormsToRequests>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
