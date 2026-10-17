import { Component as Thread } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-social-models-thread-singlepage-list-default",
  title: "Modules/Social/Thread/Singlepage/list-default",
  component: Thread,
  parameters: {
    layout: "centered",
  },
  args: { variant: "list-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Thread>, { variant: "list-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
