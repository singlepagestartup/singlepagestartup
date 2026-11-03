import { Component as Layout } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-layout-singlepage-admin-v2-select-input",
  title: "Modules/Host/Layout/Singlepage/admin-v2-select-input",
  component: Layout,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-select-input" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Layout>,
    { variant: "admin-v2-select-input" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
