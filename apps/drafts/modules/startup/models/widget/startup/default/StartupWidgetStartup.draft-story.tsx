import type { Meta, StoryObj } from "@storybook/react";

import { StartupWidgetDefault } from "../../singlepage/default/StartupWidgetDefault";
import {
  StartupWidgetStartup,
  startupWidgetOverrideProps,
} from "./StartupWidgetStartup";

const meta = {
  title: "Draft Internals/Startup/Models/Widget/Startup/Default",
  component: StartupWidgetStartup,
  parameters: {
    layout: "fullscreen",
  },
  args: startupWidgetOverrideProps,
} satisfies Meta<typeof StartupWidgetStartup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Override: Story = {};

export const CompareWithSinglepage: Story = {
  render: () => (
    <main className="min-h-screen bg-[#eaf0f7] text-slate-950 tracking-normal">
      <StartupWidgetDefault
        title="A startup workspace assembled from reusable SPS blocks."
        description="This is the singlepage baseline for the startup module widget."
      />
      <StartupWidgetStartup />
    </main>
  ),
};
