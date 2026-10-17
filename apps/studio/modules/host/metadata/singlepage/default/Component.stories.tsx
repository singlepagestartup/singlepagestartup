import { Component as Metadata } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-metadata-singlepage-default",
  title: "Modules/Host/Metadata/Singlepage/default",
  component: Metadata,
  parameters: { layout: "padded" },
  args: { variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metadata>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
