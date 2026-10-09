import type { Meta, StoryObj } from "@storybook/react";

import { ProductGallery, defaultProductGalleryProps } from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Product/Singlepage/gallery",
  component: ProductGallery,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultProductGalleryProps,
} satisfies Meta<typeof ProductGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
