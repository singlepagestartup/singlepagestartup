import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Slider } from "../../index";

const meta = {
  id: "modules-website-builder-models-slider-singlepage-admin-v2-table",
  title: "Modules/Website-Builder/Slider/Singlepage/admin-v2-table",
  component: Slider,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Slider>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
