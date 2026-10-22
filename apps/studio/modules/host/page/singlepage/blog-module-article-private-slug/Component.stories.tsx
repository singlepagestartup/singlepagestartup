import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-article-private-slug",
  title: "Modules/Host/Page/Singlepage/blog-module-article-private-slug",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "blog-module-article-private-slug" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "blog-module-article-private-slug" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Subscriber: Story = { args: { access: "granted" } };
export const Guest: Story = { args: { access: "guest" } };
