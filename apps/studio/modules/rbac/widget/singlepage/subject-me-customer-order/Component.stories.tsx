import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../../";
import { orders } from "../../../subject/singlepage/me/ecommerce-module/order/list/customer-default/fixture";
import { Component as SocialModuleWidget } from "../../../../social/widget";
import { useState } from "react";
import type { SocialWidgetChatOverviewDefaultProps } from "../../../../social/widget/singlepage/chat-overview-default/interface";
function Discussion() {
  const [messages, setMessages] = useState<
    NonNullable<
      SocialWidgetChatOverviewDefaultProps["conversation"]
    >["messages"]
  >([
    {
      id: "reply",
      author: "Мария",
      role: "Исполнитель",
      body: "Прислала первую версию стратегии. Какие каналы стоит разобрать подробнее?",
      time: "12:40",
      side: "incoming",
    },
  ]);
  return (
    <SocialModuleWidget
      variant="chat-overview-default"
      chat={{
        id: "order",
        name: "Маркетинговая стратегия",
        description: "Заказ №43db82a7",
        icon: "general",
        unread: 0,
      }}
      conversation={{
        thread: {
          id: "delivery",
          title: "Обсуждение заказа",
          excerpt: "",
          date: "26 ноября",
          unread: 0,
        },
        messages,
        onSend: (body, attachments) =>
          setMessages((previous) => [
            ...previous,
            {
              id: crypto.randomUUID(),
              author: "Вы",
              role: "Покупатель",
              body,
              time: "12:41",
              side: "outgoing",
              attachments,
            },
          ]),
      }}
    />
  );
}
const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-customer-order",
  title: "Modules/RBAC/Widget/Singlepage/subject-me-customer-order",
  component: Widget,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "subject-me-customer-order",
    order: orders[0],
    discussion: <Discussion />,
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "subject-me-customer-order" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Historical: Story = {
  args: { order: orders[1], discussion: undefined },
};
export const Unavailable: Story = { args: { order: undefined } };
