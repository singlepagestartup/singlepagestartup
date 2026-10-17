import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-root",
  title: "Modules/Host/Page/Singlepage/root",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "root" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "root" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
