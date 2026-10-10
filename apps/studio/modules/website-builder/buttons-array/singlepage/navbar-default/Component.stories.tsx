import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title:
    "Modules/Website-Builder/Models/Buttons-Array/Singlepage/navbar-default",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { activeHref: "/", orientation: "horizontal" },
  argTypes: {
    activeHref: {
      control: "select",
      options: ["/", "/ecommerce/products", "/blog"],
    },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
