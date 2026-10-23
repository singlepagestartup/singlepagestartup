import type { Meta, StoryObj } from "@storybook/react";
import { Component as Widget } from "../..";
import type { ComponentProps } from "react";
const meta = {
  id: "modules-social-models-widget-singlepage-author-overview-default",
  title: "Modules/Social/Widget/Singlepage/author-overview-default",
  component: Widget,
  args: { variant: "author-overview-default" },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "author-overview-default" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { empty: true } };
export const Error: Story = { args: { error: true } };
export const NoProjects: Story = { args: { noProducts: true } };
