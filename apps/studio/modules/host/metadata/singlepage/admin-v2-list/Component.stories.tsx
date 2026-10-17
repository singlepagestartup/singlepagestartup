import { Component as Metadata } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-metadata-singlepage-admin-v2-list",
  title: "Modules/Host/Metadata/Singlepage/admin-v2-list",
  component: Metadata,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-list" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metadata>, { variant: "admin-v2-list" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
