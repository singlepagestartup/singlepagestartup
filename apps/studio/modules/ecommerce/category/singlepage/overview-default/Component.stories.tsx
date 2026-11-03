import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model, defaultCategoryCardProps } from "../..";

const meta = {
  id: "modules-ecommerce-models-category-singlepage-overview-default",
  title: "Modules/Ecommerce/Category/Singlepage/overview-default",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { ...{}, variant: "overview-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "overview-default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MultipleMedia: Story = {
  args: {
    media: [
      <img
        key="conversation"
        src={defaultCategoryCardProps.image}
        alt={defaultCategoryCardProps.imageAlt ?? ""}
        className="h-full w-full object-cover"
      />,
      <img
        key="workspace"
        src="/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
        alt="Focused work on a project"
        className="h-full w-full object-cover"
      />,
    ],
  },
};
export const WithoutMedia: Story = { args: { media: null } };
