import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Chunk } from "../../index";

const meta = {
  id: "modules-knowledge-models-chunk-singlepage-admin-v2-table",
  title: "Modules/Knowledge/Chunk/Singlepage/admin-v2-table",
  component: Chunk,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Chunk>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
