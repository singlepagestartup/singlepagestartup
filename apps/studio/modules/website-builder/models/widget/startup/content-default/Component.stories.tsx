import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentDefault,
  defaultContentProps,
} from "../../singlepage/content-default/Component";
import { ContentDefaultStartup, startupContentProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Startup/content-default",
  component: ContentDefaultStartup,
  parameters: {
    layout: "fullscreen",
  },
  args: startupContentProps,
} satisfies Meta<typeof ContentDefaultStartup>;

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
      <ContentDefaultStartup />
    </main>
  ),
};
