import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-blog-models-widget-singlepage-article-overview-with-private-content-default",
  title:
    "Modules/Blog/Widget/Singlepage/article-overview-with-private-content-default",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    access: "locked",
    variant: "article-overview-with-private-content-default",
  },
  argTypes: {
    access: {
      control: "select",
      options: ["guest", "locked", "expired", "granted", "checking", "error"],
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "article-overview-with-private-content-default" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Guest: Story = { args: { access: "guest" } };
export const Subscriber: Story = { args: { access: "granted" } };
export const Expired: Story = { args: { access: "expired" } };
export const Checking: Story = { args: { access: "checking" } };
export const Error: Story = { args: { access: "error" } };
