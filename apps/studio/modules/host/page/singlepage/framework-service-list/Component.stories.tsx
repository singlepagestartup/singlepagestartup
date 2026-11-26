import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-framework-service-list",
  title: "Modules/Host/Page/Singlepage/framework-service-list",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { variant: "framework-service-list" },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-service-list" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const English: Story = { args: { language: "en" } };
