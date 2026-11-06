import { defaultCategoryCardProps } from "./Component";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-blog-models-category-singlepage-card",
  title: "Modules/Blog/Category/Singlepage/card",
  component: Model,
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[440px] p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: {
    ...defaultCategoryCardProps,
    href: "/?path=/story/modules-host-models-page-singlepage-blog-module-category-slug--default",
    variant: "card",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TextOnly: Story = { args: { image: "" } };
