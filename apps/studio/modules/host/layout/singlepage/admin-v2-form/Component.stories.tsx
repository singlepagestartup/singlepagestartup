import { Component as Layout } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-layout-singlepage-admin-v2-form",
  title: "Modules/Host/Layout/Singlepage/admin-v2-form",
  component: Layout,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-form" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "admin-v2-form" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
