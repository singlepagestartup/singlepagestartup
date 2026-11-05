import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Form } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-crm-models-form-singlepage-admin-v2-card",
  title: "Modules/CRM/Form/Singlepage/admin-v2-card",
  component: Form,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Form>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
