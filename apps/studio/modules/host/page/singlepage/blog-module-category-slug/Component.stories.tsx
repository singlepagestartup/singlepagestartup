import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-category-slug",
  title: "Modules/Host/Page/Singlepage/blog-module-category-slug",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { categorySlug: "frontend", variant: "blog-module-category-slug" },
  argTypes: {
    categorySlug: {
      control: "select",
      options: ["frontend", "backend", "devops"],
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "blog-module-category-slug" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Backend: Story = { args: { categorySlug: "backend" } };
export const DevOps: Story = { args: { categorySlug: "devops" } };
export const Missing: Story = { args: { categorySlug: "not-in-the-journal" } };
