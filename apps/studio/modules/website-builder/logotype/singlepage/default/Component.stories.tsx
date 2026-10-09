import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/Website-Builder/Models/Logotype/Singlepage/default",
  component: Component,
  parameters: { layout: "fullscreen" },
  args: { compact: false },
  argTypes: { compact: { control: "boolean" } },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
