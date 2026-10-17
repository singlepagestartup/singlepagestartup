import { Component as Product } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProductGalleryProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-product-singlepage-gallery",
  title: "Modules/Ecommerce/Product/Singlepage/gallery",
  component: Product,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultProductGalleryProps, variant: "gallery" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Product>, { variant: "gallery" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
