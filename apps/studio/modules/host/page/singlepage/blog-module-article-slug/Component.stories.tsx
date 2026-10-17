import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-article-slug",
  title: "Modules/Host/Page/Singlepage/blog-module-article-slug",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "blog-module-article-slug" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "blog-module-article-slug" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
