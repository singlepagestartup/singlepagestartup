import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-framework-module-find",
  title: "Modules/Host/Page/Singlepage/framework-module-find",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { variant: "framework-module-find" },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-module-find" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
