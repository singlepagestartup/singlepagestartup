import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
import { services } from "../framework-service-list/fixtures";

const meta = {
  id: "modules-rbac-models-widget-singlepage-framework-service-detail",
  title: "Modules/RBAC/Widget/Singlepage/framework-service-detail",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { variant: "framework-service-detail", service: services[0] },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-service-detail" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const English: Story = { args: { language: "en" } };
