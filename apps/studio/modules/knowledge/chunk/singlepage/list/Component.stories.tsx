import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Chunk } from "../../index";
const meta = {
  id: "modules-knowledge-models-chunk-singlepage-list",
  title: "Modules/Knowledge/Chunk/Singlepage/list",
  component: Chunk,
  args: { variant: "list", count: 3, empty: false },
  argTypes: {
    count: { control: { type: "number", min: 0, max: 50 } },
    empty: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Chunk>, { variant: "list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Many: Story = { args: { count: 20 } };
