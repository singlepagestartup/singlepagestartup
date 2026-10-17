import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ButtonsArray } from "../../index";

const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-admin-v2-table",
  title: "Modules/Website-Builder/Buttons-Array/Singlepage/admin-v2-table",
  component: ButtonsArray,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof ButtonsArray>,
    { variant: "admin-v2-table" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
