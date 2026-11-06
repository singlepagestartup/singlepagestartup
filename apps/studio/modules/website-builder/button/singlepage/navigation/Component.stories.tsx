import { Component as Button } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-button-singlepage-navigation",
  title: "Modules/Website-Builder/Button/Singlepage/navigation",
  component: Button,
  parameters: { layout: "fullscreen" },
  args: {
    label: "Home",
    href: "/",
    selected: false,
    disabled: false,
    variant: "navigation",
  },
  argTypes: {
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Button>, { variant: "navigation" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
