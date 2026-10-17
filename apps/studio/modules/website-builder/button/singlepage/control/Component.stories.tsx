import { Component as Button } from "../..";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  id: "modules-website-builder-models-button-singlepage-control",
  title: "Modules/Website-Builder/Button/Singlepage/control",
  component: Button,
  args: {
    children: "Continue",
    appearance: "primary",
    variant: "control",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Button>, { variant: "control" }>
>;
export const Default: StoryObj<typeof meta> = {};

export default meta;
