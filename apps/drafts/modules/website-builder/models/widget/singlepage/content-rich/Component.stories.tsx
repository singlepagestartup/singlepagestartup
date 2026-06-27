import type { Meta, StoryObj } from "@storybook/react";

import { ContentRich, defaultContentRichProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/content-rich",
  component: ContentRich,
  parameters: { layout: "padded" },
  args: defaultContentRichProps,
} satisfies Meta<typeof ContentRich>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
