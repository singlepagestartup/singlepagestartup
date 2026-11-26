import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
import { services } from "./fixtures";

const meta = {
  id: "modules-rbac-models-widget-singlepage-framework-service-list",
  title: "Modules/RBAC/Widget/Singlepage/framework-service-list",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { variant: "framework-service-list", services },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-service-list" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const English: Story = { args: { language: "en" } };
