import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FeaturesToButtonsArrays } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Features-To-Buttons-Arrays/Singlepage/admin-v2-table",
  component: FeaturesToButtonsArrays,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof FeaturesToButtonsArrays>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
