import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentDefault,
  defaultContentProps,
} from "../../singlepage/content-default/Component";
import { startupContentProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-widget-startup-content-default",
  title: "Modules/Website-Builder/Widget/Startup/content-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...startupContentProps, variant: "content-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "content-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Override: Story = {
  name: "override",
};

export const CompareWithSinglepage: Story = {
  name: "compare-with-singlepage",
  render: () => (
    <main className="min-h-screen bg-[#eaf0f7] text-slate-950 tracking-normal">
      <ContentDefault {...defaultContentProps} />
      <Widget variant="content-default" />
    </main>
  ),
};
