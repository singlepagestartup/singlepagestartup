import { Component as Metadata } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-metadata-singlepage-admin-v2-form",
  title: "Modules/Host/Metadata/Singlepage/admin-v2-form",
  component: Metadata,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-form" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metadata>, { variant: "admin-v2-form" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
