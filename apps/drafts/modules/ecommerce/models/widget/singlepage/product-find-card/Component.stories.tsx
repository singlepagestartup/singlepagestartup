import type { Meta, StoryObj } from "@storybook/react";
import {
  ProductFindCard as ProductFindCardComponent,
  defaultProductFindCardProps,
} from "./Component";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/product-find-card",
  component: ProductFindCardComponent,
  parameters: { layout: "fullscreen" },
  args: defaultProductFindCardProps,
} satisfies Meta<typeof ProductFindCardComponent>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  name: "default",
};
