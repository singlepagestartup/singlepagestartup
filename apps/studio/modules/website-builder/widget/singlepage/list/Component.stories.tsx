import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../../index";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-list",
  title: "Modules/Website-Builder/Widget/Singlepage/list",
  component: Widget,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
