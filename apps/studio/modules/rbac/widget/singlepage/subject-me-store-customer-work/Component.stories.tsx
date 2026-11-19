import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../..";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";
import { Component as EcommerceModuleOrder } from "../../../../ecommerce/order";
import { Component as SocialModuleThread } from "../../../../social/thread";
import { Component as FileStorageModuleFile } from "../../../../file-storage/file";
import {
  physicalOffer,
  strategyOffer,
} from "../../../../ecommerce/product/singlepage/overview-customer-work/fixture";
import { strategyVersions } from "../../../../social/thread/singlepage/customer-work/fixture";
import { downloadOrderFixture } from "../../../../file-storage/file/singlepage/order-delivery/fixture";
import type { IOrderDownload } from "../../../../file-storage/file/singlepage/order-delivery/interface";
import type { IWorkMessage } from "../../../../social/thread/singlepage/customer-work/interface";
import type { IComponentProps } from "./interface";

interface IPreviewProps {
  scenario:
    "service" | "product" | "declined" | "payment-error" | "access-denied";
}

interface IConversation {
  id: string;
  handoff: "assistant" | "pending" | "manager";
  messages: IWorkMessage[];
}

interface IDraft {
  id: string;
  conversationId: string;
  stage: "preparing" | "review" | "accepted" | "declined" | "paid";
  resultCount: number;
  acceptedVersionId?: string;
  payment: "idle" | "pending" | "failed" | "paid";
  delivered: boolean;
}

const initialOrderId = "418-02";
const initialConversationId = "418-01";
const assistant = "Алекс";
const manager = "Мария";
const createConversation = (id: string): IConversation => ({
  id,
  handoff: "assistant",
  messages: [
    {
      id: "welcome",
      author: assistant,
      kind: "operator",
      body: "Здравствуйте! Я помогу с предложением. Расскажите, какая задача у вас сейчас.",
    },
  ],
});

function Preview({ scenario }: IPreviewProps) {
  const offer = scenario === "product" ? physicalOffer : strategyOffer;
  const service = offer.kind === "service";
  const preset = scenario === "payment-error" || scenario === "declined";
  const [screen, setScreen] = useState<IComponentProps["screen"]>(
    scenario === "access-denied"
      ? "access-denied"
      : scenario === "payment-error"
        ? "order"
        : scenario === "declined"
          ? "discussion"
          : "offer",
  );
  const [conversations, setConversations] = useState<IConversation[]>(
    preset ? [createConversation(initialConversationId)] : [],
  );
  const [activeConversationId, setActiveConversationId] = useState(
    preset ? initialConversationId : undefined,
  );
  const [draft, setDraft] = useState<IDraft | undefined>(
    preset
      ? {
          id: initialOrderId,
          conversationId: initialConversationId,
          stage: scenario === "declined" ? "declined" : "accepted",
          resultCount: 2,
          acceptedVersionId:
            scenario === "payment-error" ? "strategy-v2" : undefined,
          payment: scenario === "payment-error" ? "failed" : "idle",
          delivered: false,
        }
      : undefined,
  );
  const [orderSequence, setOrderSequence] = useState(preset ? 3 : 2);
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<"ask" | "add">();
  const activeConversation = conversations.find(
    ({ id }) => id === activeConversationId,
  );
  const orderConversation =
    draft && activeConversationId === draft.conversationId ? draft : undefined;
  const acceptedVersion = strategyVersions.find(
    ({ id }) => id === draft?.acceptedVersionId,
  );

  function startConversation() {
    const id = `418-${String(conversations.length * 2 + 1).padStart(2, "0")}`;
    setConversations((current) => [...current, createConversation(id)]);
    return id;
  }

  function appendMessage(
    id: string,
    message: Omit<IWorkMessage, "id">,
    handoff?: IConversation["handoff"],
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              handoff: handoff ?? conversation.handoff,
              messages: [
                ...conversation.messages,
                { ...message, id: `${id}-${conversation.messages.length}` },
              ],
            }
          : conversation,
      ),
    );
  }

  function ask() {
    setPendingAction("ask");
    window.setTimeout(() => {
      setFeedback("");
      setActiveConversationId(startConversation());
      setScreen("discussion");
      setPendingAction(undefined);
    }, 300);
  }

  function add(sourceConversationId?: string) {
    if (draft || pendingAction) return;
    setPendingAction("add");
    window.setTimeout(() => {
      const conversationId = sourceConversationId ?? startConversation();
      const id = `418-${String(orderSequence).padStart(2, "0")}`;
      setOrderSequence((current) => current + 2);
      setDraft({
        id,
        conversationId,
        stage: "preparing",
        resultCount: 0,
        payment: "idle",
        delivered: false,
      });
      setActiveConversationId(conversationId);
      setFeedback("");
      setPendingAction(undefined);
      if (sourceConversationId)
        appendMessage(conversationId, {
          author: "",
          kind: "event",
          body: `Заказ ${id} добавлен в корзину.`,
        });
    }, 300);
  }

  function openDiscussion() {
    setActiveConversationId(draft?.conversationId ?? activeConversationId);
    setScreen("discussion");
  }

  function sendMessage(body: string, attachments: IWorkMessage["attachments"]) {
    if (!activeConversation) return;
    const { id, handoff } = activeConversation;
    appendMessage(id, { author: "Вы", kind: "customer", body, attachments });
    if (orderConversation?.stage === "preparing" && service) {
      const next = orderConversation.resultCount + 1;
      setDraft({ ...orderConversation, stage: "review", resultCount: next });
      appendMessage(id, {
        author: handoff === "manager" ? manager : assistant,
        kind: "operator",
        body:
          next === 1
            ? "Первая версия готова. Проверьте основные рекомендации в превью."
            : "Подготовили вторую версию. Проверьте раздел о партнёрствах и расходы по каналам.",
      });
      return;
    }
    if (handoff !== "pending")
      appendMessage(id, {
        author: handoff === "manager" ? manager : assistant,
        kind: "operator",
        body: "Спасибо. Уточните, пожалуйста, какой результат вы хотите получить.",
      });
  }

  function handoff() {
    if (activeConversation?.handoff !== "assistant") return;
    const { id } = activeConversation;
    appendMessage(
      id,
      {
        author: "",
        kind: "event",
        body: "Запрос на подключение менеджера отправлен.",
      },
      "pending",
    );
    window.setTimeout(() => {
      appendMessage(
        id,
        {
          author: manager,
          kind: "operator",
          body: "Здравствуйте, я Мария, менеджер мастерской. Вижу переписку и продолжу обсуждение.",
        },
        "manager",
      );
    }, 850);
  }

  function requestRevision() {
    if (orderConversation?.stage !== "review") return;
    setDraft({ ...orderConversation, stage: "preparing" });
    appendMessage(orderConversation.conversationId, {
      author: "",
      kind: "event",
      body: "Запрошена правка. Уточните изменения в сообщении.",
    });
  }

  function accept(versionId: string) {
    if (orderConversation?.stage !== "review") return;
    const version = strategyVersions.find(({ id }) => id === versionId);
    if (!version || version.number > orderConversation.resultCount) return;
    setDraft({
      ...orderConversation,
      stage: "accepted",
      acceptedVersionId: version.id,
    });
    appendMessage(orderConversation.conversationId, {
      author: "",
      kind: "event",
      body: `Принята версия ${version.number}.`,
    });
  }

  function decline() {
    if (orderConversation?.stage !== "review") return;
    setDraft({ ...orderConversation, stage: "declined" });
    appendMessage(orderConversation.conversationId, {
      author: "",
      kind: "event",
      body: "Результат отклонён. Заказ закрыт.",
    });
  }

  function pay() {
    if (
      !draft ||
      (draft.payment !== "idle" && draft.payment !== "failed") ||
      (service && draft.stage !== "accepted")
    )
      return;
    const id = draft.id;
    setDraft({ ...draft, payment: "pending" });
    window.setTimeout(() => {
      setDraft((current) =>
        current?.id === id
          ? { ...current, payment: "paid", stage: "paid" }
          : current,
      );
    }, 800);
    window.setTimeout(() => {
      setDraft((current) =>
        current?.id === id ? { ...current, delivered: true } : current,
      );
    }, 1500);
  }

  function removeOrder() {
    if (!draft) return;
    appendMessage(draft.conversationId, {
      author: "",
      kind: "event",
      body: `Заказ ${draft.id} удалён из корзины.`,
    });
    setActiveConversationId(draft.conversationId);
    setDraft(undefined);
    setFeedback("Позиция удалена. Обсуждение доступно.");
    setScreen("offer");
  }

  const files: IOrderDownload[] = draft?.delivered
    ? [
        ...(acceptedVersion
          ? [
              {
                id: acceptedVersion.id,
                kind: "result" as const,
                filename: `strategy-sever-v${acceptedVersion.number}.pdf`,
                versionNumber: acceptedVersion.number,
              },
            ]
          : []),
        {
          id: `receipt-${draft.id}`,
          kind: "receipt",
          filename: `receipt-${draft.id}.pdf`,
        },
      ]
    : [];
  const checkoutState =
    draft?.payment === "paid"
      ? "paid"
      : draft?.payment === "pending"
        ? "pending"
        : draft?.payment === "failed"
          ? "failed"
          : draft?.stage === "declined"
            ? "declined"
            : service && draft?.stage !== "accepted"
              ? "locked"
              : "ready";
  const orderStatus =
    draft?.payment === "paid"
      ? "paid"
      : draft?.stage === "declined"
        ? "closed"
        : "cart";

  const delivery =
    draft?.payment === "paid" && (screen === "order" || orderConversation) ? (
      <FileStorageModuleFile
        variant="order-delivery"
        state={draft.delivered ? "available" : "pending"}
        files={files}
        onDownload={(id) => {
          const file = files.find((entry) => entry.id === id);
          if (file) downloadOrderFixture(file);
        }}
      />
    ) : undefined;

  return (
    <Widget
      variant="subject-me-store-customer-work"
      store={offer.store}
      screen={screen}
      onBackToOffer={() => setScreen("offer")}
      offer={
        <EcommerceModuleProduct
          variant="overview-customer-work"
          offer={offer}
          orderId={draft?.id}
          orderStatus={orderStatus}
          consulting={!!activeConversation}
          feedback={feedback}
          pendingAction={pendingAction}
          onAsk={ask}
          onAdd={() => add()}
          onOpenOrder={() => setScreen("order")}
          onOpenDiscussion={openDiscussion}
        />
      }
      discussion={
        activeConversation && (
          <SocialModuleThread
            key={activeConversation.id}
            variant="customer-work"
            title={offer.title}
            reference={activeConversation.id}
            orderId={orderConversation?.id}
            operator={
              activeConversation.handoff === "manager" ? manager : assistant
            }
            handoff={activeConversation.handoff}
            messages={activeConversation.messages}
            resultStatus={service ? orderConversation?.stage : undefined}
            versions={
              service
                ? strategyVersions.slice(0, orderConversation?.resultCount)
                : undefined
            }
            acceptedVersionId={orderConversation?.acceptedVersionId}
            price={offer.price}
            delivery={orderConversation ? delivery : undefined}
            onSend={sendMessage}
            onHandoff={handoff}
            onAddToCart={
              draft || pendingAction
                ? undefined
                : () => add(activeConversation.id)
            }
            onRevision={
              orderConversation &&
              orderConversation.resultCount < strategyVersions.length
                ? requestRevision
                : undefined
            }
            onAccept={accept}
            onDecline={decline}
            onCheckout={() => setScreen("order")}
          />
        )
      }
      order={
        draft && (
          <EcommerceModuleOrder
            variant="work-checkout"
            state={checkoutState}
            order={{
              id: draft.id,
              title: offer.title,
              total: offer.price,
              resultVersionNumber: acceptedVersion?.number,
              invoiceId:
                draft.payment !== "idle"
                  ? `INV-${draft.id}${acceptedVersion ? `-V${acceptedVersion.number}` : ""}`
                  : undefined,
              shipment:
                !service && draft.payment === "paid"
                  ? {
                      status: "Передано перевозчику",
                      trackingCode: "SEVER-41802",
                    }
                  : undefined,
            }}
            onPay={pay}
            onDiscussion={openDiscussion}
            onRemove={removeOrder}
          />
        )
      }
      delivery={delivery}
    />
  );
}

const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-store-customer-work",
  title: "Modules/RBAC/Widget/Singlepage/subject-me-store-customer-work",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: { scenario: "service" },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReadyToBuy: Story = { args: { scenario: "product" } };
export const Declined: Story = { args: { scenario: "declined" } };
export const PaymentError: Story = { args: { scenario: "payment-error" } };
export const AccessDenied: Story = { args: { scenario: "access-denied" } };
