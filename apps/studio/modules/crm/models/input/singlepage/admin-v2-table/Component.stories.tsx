import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleInput } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Input/Singlepage/admin-v2-table",
  component: CrmModuleInput,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CrmModuleInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
