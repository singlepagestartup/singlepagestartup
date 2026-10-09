import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleStep } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Step/Singlepage/admin-v2-table",
  component: CrmModuleStep,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof CrmModuleStep>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
