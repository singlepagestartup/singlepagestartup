import type { Meta, StoryObj } from "@storybook/react";

import { ContentCta, defaultContentCtaProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/content-cta",
  component: ContentCta,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentCtaProps,
} satisfies Meta<typeof ContentCta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
