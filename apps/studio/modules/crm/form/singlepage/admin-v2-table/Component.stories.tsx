import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Form } from "../../index";

const meta = {
  id: "modules-crm-models-form-singlepage-admin-v2-table",
  title: "Modules/CRM/Form/Singlepage/admin-v2-table",
  component: Form,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Form>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
