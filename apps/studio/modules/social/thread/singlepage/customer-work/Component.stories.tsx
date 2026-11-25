import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Thread } from "../..";
import { strategyFiles } from "./fixture";
import type { IComponentProps } from "./interface";

function Preview(props: IComponentProps) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8" lang="ru">
      <Thread {...props} variant="customer-work" />
    </div>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-customer-work",
  title: "Modules/Social/Thread/Singlepage/customer-work",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Стратегия продвижения",
    reference: "418-01",
    orderId: "418-02",
    operator: "Алекс",
    handoff: "assistant",
    price: 4900,
    resultStatus: "review",
    files: strategyFiles,
    messages: [
      {
        id: "m1",
        author: "Покупатель",
        kind: "customer",
        body: "Хочу привлечь покупателей в мастерскую.",
      },
      {
        id: "m2",
        author: "Алекс",
        kind: "operator",
        body: "Прикрепил стратегию. Проверьте план публикаций и расходы по каналам.",
      },
    ],
    onSend: () => {},
    onHandoff: () => {},
    onRevision: () => {},
    onAccept: () => {},
    onDecline: () => {},
    onCheckout: () => {},
  },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Accepted: Story = {
  args: {
    handoff: "manager",
    operator: "Мария",
    resultStatus: "accepted",
    acceptedFileId: "partnerships-file",
  },
};
export const Declined: Story = { args: { resultStatus: "declined" } };
export const WaitingForManager: Story = {
  args: { handoff: "pending", resultStatus: "preparing" },
};
