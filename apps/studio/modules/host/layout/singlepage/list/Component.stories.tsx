import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Layout } from "../../index";
const meta = {
  id: "modules-host-models-layout-singlepage-list",
  title: "Modules/Host/Layout/Singlepage/list",
  component: Layout,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
