import type { Meta, StoryObj } from "@storybook/react";
import { ContentFaq, defaultContentFaqProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/content-faq",
  component: ContentFaq,
  parameters: { layout: "fullscreen" },
  args: defaultContentFaqProps,
} satisfies Meta<typeof ContentFaq>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
