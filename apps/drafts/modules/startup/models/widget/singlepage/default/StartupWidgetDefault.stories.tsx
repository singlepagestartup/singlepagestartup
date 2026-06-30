import type { Meta, StoryObj } from "@storybook/react";

import {
  StartupWidgetDefault,
  startupWidgetDefaultProps,
} from "./StartupWidgetDefault";

const meta = {
  title: "Draft Internals/Startup/Models/Widget/Singlepage/Default",
  component: StartupWidgetDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: startupWidgetDefaultProps,
} satisfies Meta<typeof StartupWidgetDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
