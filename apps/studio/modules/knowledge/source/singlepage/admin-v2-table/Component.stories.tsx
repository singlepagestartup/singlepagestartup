import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Source } from "../../index";

const meta = {
  id: "modules-knowledge-models-source-singlepage-admin-v2-table",
  title: "Modules/Knowledge/Source/Singlepage/admin-v2-table",
  component: Source,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Source>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
