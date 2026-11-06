import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-admin-entity-drawer",
  title: "Modules/Host/Page/Singlepage/admin-entity-drawer",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "admin-entity-drawer" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "admin-entity-drawer" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
