import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-terms",
  title: "Modules/Host/Page/Singlepage/terms",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "terms" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "terms" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
