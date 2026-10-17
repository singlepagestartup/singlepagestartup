import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-privacy",
  title: "Modules/Host/Page/Singlepage/privacy",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "privacy" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "privacy" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
