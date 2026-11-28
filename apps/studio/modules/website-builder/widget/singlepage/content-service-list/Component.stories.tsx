import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Widget } from "../..";
import { ServiceCard } from "./ServiceCard";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-service-list",
  title: "Modules/Website Builder/Widget/Singlepage/content-service-list",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "content-service-list" },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "content-service-list" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <ServiceCard
        title="Бриф бизнеса"
        summary="Бриф с целями, ограничениями и открытыми вопросами."
        href="/framework/services/framework-business-brief"
        language="ru"
        price={<span className="font-semibold">900 ₽</span>}
      />
    ),
  },
};
export const Empty: Story = {};
