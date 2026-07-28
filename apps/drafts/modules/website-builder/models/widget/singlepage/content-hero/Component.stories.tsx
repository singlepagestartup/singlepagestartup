import type { Meta, StoryObj } from "@storybook/react";

import { ContentHero, defaultContentHeroProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/content-hero",
  component: ContentHero,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentHeroProps,
} satisfies Meta<typeof ContentHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
