import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleOption } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Option/Singlepage/admin-v2-table",
  component: CrmModuleOption,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof CrmModuleOption>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
