import { Component as Layout } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-layout-singlepage-admin-v2-list",
  title: "Modules/Host/Layout/Singlepage/admin-v2-list",
  component: Layout,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Layout>, { variant: "admin-v2-list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
