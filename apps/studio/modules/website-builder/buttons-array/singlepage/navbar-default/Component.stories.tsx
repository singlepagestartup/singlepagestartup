import { Component as ButtonsArray } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-navbar-default",
  title: "Modules/Website-Builder/Buttons-Array/Singlepage/navbar-default",
  component: ButtonsArray,
  parameters: { layout: "fullscreen" },
  args: {
    activeHref: "/",
    orientation: "horizontal",
    variant: "navbar-default",
  },
  argTypes: {
    activeHref: {
      control: "select",
      options: ["/", "/ecommerce/products", "/blog"],
    },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof ButtonsArray>,
    { variant: "navbar-default" }
  >
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
