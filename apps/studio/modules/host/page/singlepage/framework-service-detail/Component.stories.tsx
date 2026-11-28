import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-framework-service-detail",
  title: "Modules/Host/Page/Singlepage/framework-service-detail",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "framework-service-detail",
    productSlug: "framework-business-brief",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-service-detail" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const English: Story = { args: { language: "en" } };
export const Unavailable: Story = { args: { productSlug: "unavailable" } };
