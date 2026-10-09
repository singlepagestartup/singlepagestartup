import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleOption } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Option/Singlepage/admin-v2-table",
  component: CrmModuleOption,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof CrmModuleOption>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
