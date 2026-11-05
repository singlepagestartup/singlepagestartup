import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-article-find",
  title: "Modules/Host/Page/Singlepage/blog-module-article-find",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "blog-module-article-find" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "blog-module-article-find" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
