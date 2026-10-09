import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CrmModuleWidget } from "../../index";
const meta = {
  title: "Modules/CRM/Models/Widget/Singlepage/list",
  component: CrmModuleWidget,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<typeof CrmModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
