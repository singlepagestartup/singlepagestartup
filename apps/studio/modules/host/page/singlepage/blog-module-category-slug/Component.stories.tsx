import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-category-slug",
  title: "Modules/Host/Page/Singlepage/blog-module-category-slug",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "blog-module-category-slug" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "blog-module-category-slug" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
