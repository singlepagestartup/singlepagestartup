import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-v2-form",
  title: "Modules/Host/Page/Singlepage/admin-v2-form",
  component: Page,
  parameters: { layout: "padded" },
  args: { variant: "admin-v2-form" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-v2-form" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
