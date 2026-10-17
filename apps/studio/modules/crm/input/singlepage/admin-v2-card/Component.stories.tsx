import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Input } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-crm-models-input-singlepage-admin-v2-card",
  title: "Modules/CRM/Input/Singlepage/admin-v2-card",
  component: Input,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Input>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
