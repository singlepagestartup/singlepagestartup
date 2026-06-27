import type { Meta, StoryObj } from "@storybook/react";
import {
  ContentTestimonials,
  defaultContentTestimonialsProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-testimonials",
  component: ContentTestimonials,
  parameters: { layout: "fullscreen" },
  args: defaultContentTestimonialsProps,
} satisfies Meta<typeof ContentTestimonials>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
