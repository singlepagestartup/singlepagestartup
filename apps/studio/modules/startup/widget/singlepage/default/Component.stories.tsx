import type { Meta, StoryObj } from "@storybook/react";

import { StartupWidgetDefault } from "./Component";

const meta = {
  id: "modules-startup-models-widget-singlepage-default",
  title: "Modules/Startup/Models/Widget/Singlepage/default",
  component: StartupWidgetDefault,
  parameters: { layout: "padded" },
  args: {
    title: "Startup widget",
    subtitle: "Content section",
    description: "Add your project's title, description, and layout here.",
  },
} satisfies Meta<typeof StartupWidgetDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };

export const TitleOnly: Story = {
  args: { subtitle: undefined, description: undefined },
};
