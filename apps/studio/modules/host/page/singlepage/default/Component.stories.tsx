import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-default",
  title: "Modules/Host/Page/Singlepage/default",
  component: Page,
  parameters: { layout: "padded" },
  args: { variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
