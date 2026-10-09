import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleForm } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Form/Singlepage/admin-v2-table",
  component: CrmModuleForm,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CrmModuleForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
