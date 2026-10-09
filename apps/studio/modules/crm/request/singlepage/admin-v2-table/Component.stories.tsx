import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleRequest } from "../../index";

const meta = {
  title: "Modules/CRM/Models/Request/Singlepage/admin-v2-table",
  component: CrmModuleRequest,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof CrmModuleRequest>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
