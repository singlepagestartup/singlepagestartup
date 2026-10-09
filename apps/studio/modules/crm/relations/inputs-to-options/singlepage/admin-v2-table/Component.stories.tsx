import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as InputsToOptions } from "../../index";

const meta = {
  title: "Modules/CRM/Relations/Inputs-To-Options/Singlepage/admin-v2-table",
  component: InputsToOptions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof InputsToOptions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
