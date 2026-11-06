import { Component as Logotype } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-website-builder-models-logotype-singlepage-default",
  title: "Modules/Website-Builder/Logotype/Singlepage/default",
  component: Logotype,
  parameters: { layout: "fullscreen" },
  args: { compact: false, variant: "default" },
  argTypes: { compact: { control: "boolean" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Logotype>, { variant: "default" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
