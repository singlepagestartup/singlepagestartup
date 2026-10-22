import { defaultSliderProps } from "./Component";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-slider-singlepage-default",
  title: "Modules/Website-Builder/Slider/Singlepage/default",
  component: Model,
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: { ...defaultSliderProps, navigation: "arrows", variant: "default" },
  argTypes: {
    navigation: { control: "select", options: ["arrows", "numbers", "dots"] },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { slides: [] } };

export const Arrows: Story = { args: { navigation: "arrows" } };
export const Numbers: Story = { args: { navigation: "numbers" } };
export const Dots: Story = { args: { navigation: "dots" } };
export const SingleSlide: Story = {
  args: { slides: defaultSliderProps.slides.slice(0, 1) },
};
