import { defaultSlideProps } from "./Component";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-slide-singlepage-default",
  title: "Modules/Website-Builder/Slide/Singlepage/default",
  component: Model,
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: { ...defaultSlideProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const ImageWithLink: Story = {
  args: { title: "", description: "", actions: [], href: "/en/framework" },
};
