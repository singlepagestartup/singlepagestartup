import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StepsToInputs } from "../../index";

const meta = {
  title: "Modules/CRM/Relations/Steps-To-Inputs/Singlepage/admin-v2-table",
  component: StepsToInputs,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof StepsToInputs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
