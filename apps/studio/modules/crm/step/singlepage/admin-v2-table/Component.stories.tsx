import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Step } from "../../index";

const meta = {
  id: "modules-crm-models-step-singlepage-admin-v2-table",
  title: "Modules/CRM/Step/Singlepage/admin-v2-table",
  component: Step,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Step>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
