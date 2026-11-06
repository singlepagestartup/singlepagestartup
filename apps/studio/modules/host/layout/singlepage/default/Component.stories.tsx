import { Component as Layout } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-layout-singlepage-default",
  title: "Modules/Host/Layout/Singlepage/default",
  component: Layout,
  parameters: { layout: "padded" },
  args: { variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
