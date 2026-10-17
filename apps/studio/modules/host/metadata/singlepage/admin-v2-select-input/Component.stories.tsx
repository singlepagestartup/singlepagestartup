import { Component as Metadata } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-metadata-singlepage-admin-v2-select-input",
  title: "Modules/Host/Metadata/Singlepage/admin-v2-select-input",
  component: Metadata,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-select-input" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Metadata>,
    { variant: "admin-v2-select-input" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
