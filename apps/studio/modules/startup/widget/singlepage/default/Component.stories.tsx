import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-startup-models-widget-singlepage-default",
  title: "Modules/Startup/Widget/Singlepage/default",
  component: Widget,
  parameters: { layout: "padded" },
  args: {
    title: "Startup widget",
    subtitle: "Content section",
    description: "Add your project's title, description, and layout here.",
    variant: "default",
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };

export const TitleOnly: Story = {
  args: { subtitle: undefined, description: undefined },
};
