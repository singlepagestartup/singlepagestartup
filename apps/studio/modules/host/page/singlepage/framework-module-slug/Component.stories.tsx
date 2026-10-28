import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-host-models-page-singlepage-framework-module-slug",
  title: "Modules/Host/Page/Singlepage/framework-module-slug",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: { variant: "framework-module-slug", moduleSlug: "rbac" },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "framework-module-slug" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Knowledge: Story = { args: { moduleSlug: "knowledge" } };
export const Missing: Story = { args: { moduleSlug: "missing" } };
