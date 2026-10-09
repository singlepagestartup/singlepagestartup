import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ButtonsArraysToButtons } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Buttons-Arrays-To-Buttons/Singlepage/admin-v2-table",
  component: ButtonsArraysToButtons,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ButtonsArraysToButtons>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
