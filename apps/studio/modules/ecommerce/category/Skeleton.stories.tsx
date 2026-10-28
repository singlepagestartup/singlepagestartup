import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton as Component } from "./index";
const meta = {
  id: "modules-ecommerce-models-category-singlepage-loading",
  title: "Modules/Ecommerce/Category/Singlepage/Loading",
  component: Component,
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[440px]">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Component>;
export default meta;
export const Loading: StoryObj<typeof meta> = {};
