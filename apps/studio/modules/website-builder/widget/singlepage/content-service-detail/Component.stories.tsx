import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Widget } from "../..";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-service-detail",
  title: "Modules/Website Builder/Widget/Singlepage/content-service-detail",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: { variant: "content-service-detail" },
} satisfies Meta<
  Extract<ComponentProps<typeof Widget>, { variant: "content-service-detail" }>
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    slots: {
      heading: "Бриф бизнеса",
      summary: "Бриф с целями, ограничениями и открытыми вопросами.",
      description: "Аккаунт-менеджер изучит заметки о бизнесе и прайс.",
      price: <span className="font-semibold">900 ₽</span>,
    },
    children: (
      <a
        href="/framework/services/framework-business-brief#booking"
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Открыть оформление заказа
      </a>
    ),
  },
};
export const Unavailable: Story = {};
