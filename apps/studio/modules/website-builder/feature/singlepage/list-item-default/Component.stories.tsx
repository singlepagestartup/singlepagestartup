import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultFeatureListItemDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-list-item-default",
  title: "Modules/Website-Builder/Feature/Singlepage/list-item-default",
  component: Feature,
  parameters: { layout: "centered" },
  args: { ...defaultFeatureListItemDefaultProps, variant: "list-item-default" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Feature>,
    { variant: "list-item-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
