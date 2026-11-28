/**
 * @jest-environment jsdom
 *
 * BDD Suite: OpenRouter chat profile sidebar.
 *
 * Given: the default social chat composer supports AI/OpenRouter chats.
 * When: a user interacts with Knowledge chat commands, skills, and message profile names.
 * Then: /learn, @knowledge, profile skills, and profile knowledge work when an AI profile is present.
 */

import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  customerWorkRateCallback,
  customerWorkRatePromptKey,
} from "@sps/rbac/models/subject/sdk/model";
import { orderFileReviewInteraction } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import userEvent from "@testing-library/user-event";
import {
  mockChatComponentState,
  mockAttachKnowledgeFiles,
  mockCustomerWork,
  mockChangeCustomerWork,
  mockOrderWorkRead,
  mockOrderWorkContent,
  mockKnowledgeSourceCreateMutate,
  mockKnowledgeSourceDeleteMutateAsync,
  mockKnowledgeSourceUpdateMutate,
  mockKnowledgeReindexDocumentMutateAsync,
  mockMessageCreateMutate,
  mockOpenRouterModelFavoriteUpdateMutate,
  mockProfileAvatarUpdateMutateAsync,
  mockProfileUpdateMutateAsync,
  mockProfileSkillFind,
  mockThreadUpdateMutate,
  mockToastSuccess,
  mockSocialSkillCreateMutateAsync,
  mockSocialSkillUpdateMutateAsync,
  renderComponent,
  resetChatComponentMocks,
} from "./test-utils";

jest.mock(
  "../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview",
  () => ({
    ResultReview: () => <p>Review order files</p>,
  }),
);

const aiOpponentProfile = {
  id: "assistant-profile-1",
  slug: "chat-gpt-1",
  variant: "artificial-intelligence",
  adminTitle: "Chat GPT 1",
};

function aiReactionRequest(
  overrides: Partial<{
    modelId: string;
    reasoning: string;
    skillIds: string[];
    useKnowledgeSearch: boolean;
  }> = {},
) {
  return {
    version: 1,
    modelId: "auto",
    reasoning: "auto",
    skillIds: [],
    useKnowledgeSearch: false,
    ...overrides,
  };
}

describe("Social thread context", () => {
  beforeEach(() => resetChatComponentMocks());

  const rateMessageId = "9d2123d3-f25a-4aad-9073-52471d9aab84";
  const meteredOrder = {
    chatId: "chat-1",
    threadId: "thread-1",
    storeId: "store-1",
    taskId: "59ffd5b2-5c40-4617-adbd-218b1ab935d3",
    orderId: "order-1",
    status: "active",
    assignment: "assistant",
    customerPays: true,
    canApproveRate: true,
    ratePromptMessageId: rateMessageId,
    price: { key: "a".repeat(64) },
    workflow: { title: "Business brief", stageTitle: "Intake" },
  };

  function rateMessage({
    id = rateMessageId,
    priceKey = meteredOrder.price.key,
    description = "Перед началом работы подтвердите тариф.",
    label = "Подтвердить тариф",
    callback = customerWorkRateCallback(id),
  } = {}) {
    return {
      type: "message" as const,
      data: {
        id,
        variant: "customer-work",
        createdAt: new Date(),
        description,
        workReplyKey: customerWorkRatePromptKey(
          meteredOrder.taskId,
          1,
          priceKey,
        ),
        metadata: {
          customerWorkRatePrompt: {
            taskId: meteredOrder.taskId,
            priceKey,
            maximum: "15",
          },
        },
        interaction: {
          inline_keyboard: [[{ text: label, callback_data: callback }]],
        },
      },
    };
  }

  it("keeps an empty order conversation empty until the agent sends a message", () => {
    mockCustomerWork.mockReturnValue({ data: meteredOrder });
    renderComponent("customer-work", { language: "ru" });
    expect(screen.getByText("Сообщений пока нет")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Начало работы" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Подтвердить тариф" }),
    ).toBeNull();
    expect(mockChangeCustomerWork).not.toHaveBeenCalled();
  });

  it("approves the exact saved message from its inline keyboard", async () => {
    mockCustomerWork.mockReturnValue({ data: meteredOrder });
    const thread = renderComponent("customer-work", {
      language: "ru",
      socialModuleMessagesAndActionsQuery: [
        rateMessage({
          id: "a4ef79ed-f2f7-4db1-87ec-beeb4512d642",
          priceKey: "b".repeat(64),
          description: "Предыдущий тариф.",
        }),
        rateMessage(),
        rateMessage({
          id: "3e19abaf-5e6a-4613-aed9-1090559ebaec",
          description: "Старое подтверждение по той же ставке.",
        }),
        rateMessage({
          id: "63475bf5-4339-43ad-a5ef-fc7c209f4ef7",
          description: "Сообщение с неверной кнопкой.",
          callback: customerWorkRateCallback(rateMessageId),
        }),
      ],
    });
    const timeline = within(screen.getByRole("log", { name: "Сообщения" }));
    const message = timeline
      .getByText("Перед началом работы подтвердите тариф.")
      .closest("article");
    expect(message).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "Подтвердить тариф" }),
    ).toHaveLength(1);
    const button = within(message!).getByRole("button", {
      name: "Подтвердить тариф",
    });
    expect(button.getAttribute("type")).toBe("button");
    expect(Array.from(button.classList)).toEqual(
      expect.arrayContaining(["w-full", "text-sm", "py-2", "px-4"]),
    );
    expect(button.closest("form")).toBeNull();
    expect(timeline.getByText("Предыдущий тариф.")).toBeTruthy();
    expect(mockChangeCustomerWork).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => {
      expect(mockChangeCustomerWork).toHaveBeenCalledWith({
        id: "subject-1",
        data: {
          operation: "approve-budget",
          storeId: meteredOrder.storeId,
          taskId: meteredOrder.taskId,
          messageId: rateMessageId,
          priceKey: meteredOrder.price.key,
          maximum: "15",
          operationKey: expect.any(String),
        },
      });
      expect(button.hasAttribute("disabled")).toBe(true);
    });

    mockCustomerWork.mockReturnValue({
      data: { ...meteredOrder, rateApproved: true },
    });
    thread.rerenderThread({ id: meteredOrder.threadId });
    expect(
      screen.getByText("Перед началом работы подтвердите тариф."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Подтвердить тариф" }),
    ).toBeNull();
  });

  it("prevents visitors without spending permission from approving a saved rate", () => {
    mockCustomerWork.mockReturnValue({
      data: { ...meteredOrder, canApproveRate: false },
    });
    renderComponent("customer-work", {
      socialModuleMessagesAndActionsQuery: [
        rateMessage({
          description: "Approve the rate before work starts.",
          label: "Approve rate",
        }),
      ],
    });
    expect(
      screen.getByText("Approve the rate before work starts."),
    ).toBeTruthy();
    const button = screen.getByRole("button", { name: "Approve rate" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(mockChangeCustomerWork).not.toHaveBeenCalled();
  });

  it("uses the saved button label and retries a failed approval with the same operation key", async () => {
    mockCustomerWork.mockReturnValue({ data: meteredOrder });
    mockChangeCustomerWork.mockRejectedValueOnce(new Error("Request failed"));
    renderComponent("customer-work", {
      language: "ru",
      socialModuleMessagesAndActionsQuery: [
        rateMessage({ label: "Принять тариф" }),
      ],
    });
    const button = screen.getByRole("button", { name: "Принять тариф" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Не удалось подтвердить тариф.",
    );
    expect(mockChangeCustomerWork).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute("disabled")).toBe(false);

    fireEvent.click(button);
    await waitFor(() => {
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(screen.queryByRole("alert")).toBeNull();
    });
    expect(mockChangeCustomerWork).toHaveBeenCalledTimes(2);
    expect(mockChangeCustomerWork.mock.calls[1]).toEqual(
      mockChangeCustomerWork.mock.calls[0],
    );
  });

  it("renders the persisted payment confirmation and the customer reply as chat messages", async () => {
    const eventId = "1afa2a3e-d105-4a98-a51d-8a4b2d458c26";
    const orderPayment = {
      eventId,
      orderId: "fc28fecb-41e8-4428-8c2e-6b1368797cc9",
      paymentIntentId: "450a19cc-ccdd-49cb-9e48-27e5a0be9c95",
      invoiceId: "041f43ae-969d-4722-a314-c133cd7f605c",
      currency: "RUB",
      amount: "500.0000",
    };
    renderComponent("customer-work", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "payment",
            description: "Payment received: 500 RUB.",
            variant: "customer-work",
            createdAt: new Date(),
            workReplyKey: `order-payment:${eventId}`,
            metadata: { orderPayment },
          },
        },
        {
          type: "message",
          data: {
            id: "claim",
            variant: "customer-work",
            createdAt: new Date(),
            description: "I have paid",
            metadata: { orderPayment },
          },
        },
      ],
    });
    expect(
      await screen.findAllByText("Payment received: 500 RUB."),
    ).toHaveLength(1);
    expect(screen.getByText("I have paid")).toBeTruthy();
  });

  it.each([
    {
      variant: "default",
      language: "en",
      name: "Message",
      hint: "Enter to send. Shift+Enter for a new line.",
    },
    {
      variant: "customer-work",
      language: "ru",
      name: "Сообщение",
      hint: "Enter — отправить. Shift+Enter — новая строка.",
    },
    {
      variant: "store-employee",
      language: "ru",
      name: "Сообщение",
      hint: "Enter — отправить. Shift+Enter — новая строка.",
    },
  ] as const)(
    "puts the keyboard hints in the $variant composer placeholder",
    async ({ variant, language, name, hint }) => {
      renderComponent(variant, { language });

      const textarea = screen.getByRole("textbox", { name, description: hint });
      expect(textarea.getAttribute("placeholder")).toBe(hint);
      expect(screen.getByText(hint).classList).toContain("sr-only");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      expect(
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true }),
      ).toBe(true);
      expect(mockMessageCreateMutate).not.toHaveBeenCalled();
      fireEvent.keyDown(textarea, { key: "Enter" });
      await waitFor(() =>
        expect(mockMessageCreateMutate).toHaveBeenCalledTimes(1),
      );
    },
  );

  it("opens older document threads as conversations", () => {
    renderComponent("ai-chat", {
      socialModuleThread: {
        id: "thread-1",
        title: "Brief.md",
        metadata: {
          aiChatDocument: {
            key: "brief",
            profileId: aiOpponentProfile.id,
            sourceIds: ["section-1"],
          },
        },
      },
    });

    expect(screen.getByRole("textbox", { name: "Message" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Document" })).toBeNull();
    expect(screen.queryByRole("button", { name: /right sidebar/i })).toBeNull();
    expect(mockCustomerWork).toHaveBeenCalledWith({
      id: "subject-1",
      threadId: "",
    });
  });

  it("keeps a Knowledge mention as plain text in a CRM message", async () => {
    renderComponent("customer-work", {
      knowledgeAssistantProfile: aiOpponentProfile,
    });

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "@kn" } });
    expect(screen.queryByText("Knowledge")).toBeNull();
    expect(screen.queryByText("No skills found")).toBeNull();

    const description = "@knowledge Do you have the specification?";
    fireEvent.change(textarea, { target: { value: description } });
    expect(screen.queryByText("@knowledge")).toBeNull();
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description }),
        }),
        expect.any(Object),
      );
    });
    const [payload] = mockMessageCreateMutate.mock.calls[0];
    expect(payload.data.metadata?.knowledgeMention).toBeUndefined();
  });

  it("sends the selected CRM model with the triggering message", async () => {
    renderComponent("customer-work");
    fireEvent.click(screen.getByRole("button", { name: "Reply model" }));
    const picker = screen.getByRole("dialog", { name: "Reply model" });
    expect(within(picker).queryByText("GPT Basic")).toBeNull();
    fireEvent.click(within(picker).getByText("GPT-5.2"));
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Please review the brief." },
    });
    fireEvent.click(screen.getByLabelText("Send message"));
    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { provider: { modelId: "openai/gpt-5.2" } },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  it("sends the direct provider ID with a supported order reasoning effort", async () => {
    const user = userEvent.setup();
    mockChatComponentState.orderModelIds = ["gpt-5.2"];
    renderComponent("customer-work");

    await user.click(screen.getByRole("button", { name: "Reply model" }));
    const search = screen.getByRole("searchbox", { name: "Search models" });
    expect(document.activeElement).toBe(search);
    await user.type(search, "openai/gpt-5.2");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.queryByRole("dialog", { name: "Reply model" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Thinking" }));
    expect(screen.queryByRole("menuitemradio", { name: "Medium" })).toBeNull();
    await user.click(screen.getByRole("menuitemradio", { name: "High" }));
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "Review the brief.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(mockThreadUpdateMutate).not.toHaveBeenCalled();
    expect(mockMessageCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { provider: { modelId: "gpt-5.2", reasoning: "high" } },
        }),
      }),
      expect.any(Object),
    );
  });

  it("shares one favorite between direct-provider and OpenRouter aliases", () => {
    mockChatComponentState.orderModelIds = ["gpt-5.2"];
    const order = renderComponent("customer-work");
    const replyTrigger = screen.getByRole("button", { name: "Reply model" });
    fireEvent.click(replyTrigger);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Favorite GPT-5.2 (OpenAI API)",
        pressed: false,
      }),
    );
    expect(replyTrigger.textContent).toContain("Stage default");
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeTruthy();
    expect(mockOpenRouterModelFavoriteUpdateMutate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { favoriteModelIds: ["openai/gpt-5.2"] },
      }),
      expect.any(Object),
    );
    order.unmount();

    const assistant = renderComponent("knowledge");
    fireEvent.click(
      screen.getByRole("button", { name: "Select OpenRouter model" }),
    );
    expect(screen.getByRole("heading", { name: "Favorites" })).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Favorite GPT-5.2", pressed: true }),
    );
    expect(screen.queryByRole("heading", { name: "Favorites" })).toBeNull();
    assistant.unmount();

    renderComponent("customer-work");
    fireEvent.click(screen.getByRole("button", { name: "Reply model" }));
    expect(screen.queryByRole("heading", { name: "Favorites" })).toBeNull();
  });

  it("shows the fixed stage model and reasoning in the customer composer", () => {
    mockChatComponentState.orderModelIds = [];
    mockChatComponentState.fixedStageModelId = "gpt-6.2-astra";
    mockChatComponentState.fixedStageModelReasoning = "medium";
    renderComponent("customer-work");
    expect(screen.queryByText("Stage model")).toBeNull();
    expect(screen.getByText(/GPT-6.2 Astra · medium/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reply model" })).toBeNull();
  });

  it("keeps order choices scoped to each thread and requires a still-eligible model", async () => {
    const user = userEvent.setup();
    const order = renderComponent("customer-work");
    await user.click(screen.getByRole("button", { name: "Reply model" }));
    await user.click(screen.getByText("GPT-5.2"));
    await user.click(screen.getByRole("button", { name: "Thinking" }));
    await user.click(screen.getByRole("menuitemradio", { name: "High" }));

    mockChatComponentState.orderModelIds = [];
    order.rerenderThread({ id: "thread-1" });
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "Review the brief.",
    );
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Send message" })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Reply model" }).textContent,
    ).toContain("Model unavailable");

    await user.click(screen.getByRole("button", { name: "Reply model" }));
    await user.click(screen.getByRole("button", { name: "Stage default" }));
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(mockMessageCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { provider: { modelId: "auto" } },
        }),
      }),
      expect.any(Object),
    );

    mockChatComponentState.orderModelIds = ["openai/gpt-5.2"];
    order.rerenderThread({ id: "thread-1" });
    await user.click(screen.getByRole("button", { name: "Reply model" }));
    await user.click(screen.getByText("GPT-5.2"));

    order.rerenderThread({ id: "thread-2" });
    expect(
      screen.getByRole("button", { name: "Reply model" }).textContent,
    ).toContain("Stage default");
    expect(screen.queryByRole("button", { name: "Thinking" })).toBeNull();
  });

  it("rolls back a failed favorites update and honors an empty server list", () => {
    window.localStorage.setItem(
      "sps.openrouter.modelFavorites.subject-1",
      JSON.stringify(["gpt-5.2"]),
    );
    let rejectFavorite: (() => void) | undefined;
    mockOpenRouterModelFavoriteUpdateMutate.mockImplementationOnce(
      (_props, callbacks) => {
        rejectFavorite = callbacks.onError;
      },
    );
    renderComponent("knowledge");
    fireEvent.click(
      screen.getByRole("button", { name: "Select OpenRouter model" }),
    );
    expect(screen.queryByRole("heading", { name: "Favorites" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Favorite GPT-5.2", pressed: false }),
    );
    expect(
      screen.getByRole("button", { name: "Favorite GPT-5.2", pressed: true }),
    ).toBeTruthy();

    act(() => rejectFavorite?.());
    expect(
      screen.getByRole("button", { name: "Favorite GPT-5.2", pressed: false }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Favorites" })).toBeNull();
  });

  it("shows linked products for a discussion before a CRM task exists", () => {
    renderComponent("default", {
      socialModuleThread: {
        id: "thread-1",
        linkedProducts: [
          { id: "product-1", slug: "cover", title: { en: "Cover" } },
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    expect(
      screen.getByRole("link", { name: "Cover" }).getAttribute("href"),
    ).toBe("/en/ecommerce/products/cover");
    expect(screen.queryByRole("heading", { name: "Task" })).toBeNull();
  });

  it("shows the order’s published offer title and keeps the selected offer", () => {
    mockCustomerWork.mockReturnValue({
      data: {
        chatId: "chat-1",
        threadId: "thread-1",
        storeId: "store-1",
        taskId: "task-1",
        orderId: "order-1",
        offerId: "offer-1",
        productSlug: "cover",
        productTitle: { en: "Cover design" },
        status: "active",
        assignment: "manager",
        operator: "Alex",
      },
    });
    renderComponent("default", {
      socialModuleThread: { id: "thread-1", hasCustomerWork: true },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    expect(
      screen.getByRole("link", { name: "Cover design" }).getAttribute("href"),
    ).toBe("/en/ecommerce/products/cover?offer=offer-1#order-order-1");
    expect(screen.queryByRole("link", { name: "View order" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Manager" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Private notes" })).toBeNull();
  });

  it("places the review controls only in the newest agent prompt for the preview", () => {
    const scope = { storeId: "store-1", taskId: "task-1", orderId: "order-1" };
    const fileId = "1afa2a3e-d105-4a98-a51d-8a4b2d458c26";
    mockCustomerWork.mockReturnValue({
      data: {
        ...scope,
        chatId: "chat-1",
        threadId: "thread-1",
        status: "active",
        assignment: "assistant",
        workflow: { title: "Cover", stageTitle: "Review", orderStep: "review" },
      },
    });
    mockOrderWorkRead.mockReturnValue({
      data: { ...scope, state: "awaiting-result", files: [{ id: fileId }] },
    });
    renderComponent("customer-work", {
      socialModuleMessagesAndActionsQuery: [
        "First request",
        "Please review again",
      ].map((description, index) => ({
        type: "message",
        data: {
          id: String(index),
          description,
          variant: "customer-work",
          workReplyKey: "reply-" + index,
          createdAt: new Date(1000 + index),
          metadata: { orderResultFileId: fileId },
          interaction: orderFileReviewInteraction(fileId, false),
        },
      })),
    });
    const controls = screen.getByText("Review order files");
    expect(
      screen
        .getByText("Please review again")
        .closest("article")
        ?.contains(controls),
    ).toBe(true);
    expect(
      screen.getByText("First request").closest("article")?.contains(controls),
    ).toBe(false);
  });

  it("opens the full brief draft from the review message", async () => {
    const scope = { storeId: "store-1", taskId: "task-1", orderId: "order-1" };
    const fileId = "1afa2a3e-d105-4a98-a51d-8a4b2d458c26";
    const content = `${"Brief detail.\n".repeat(65)}Open question about the budget.`;
    mockCustomerWork.mockReturnValue({
      data: {
        ...scope,
        chatId: "chat-1",
        threadId: "thread-1",
        status: "active",
        workflow: { title: "Brief", stageTitle: "Review", orderStep: "review" },
      },
    });
    mockOrderWorkRead.mockReturnValue({
      data: {
        ...scope,
        state: "awaiting-result",
        files: [
          { id: fileId, includedInWork: true, previewMimeType: "text/plain" },
        ],
      },
    });
    mockOrderWorkContent.mockResolvedValue(
      new Blob([content], { type: "text/plain" }),
    );
    renderComponent("customer-work", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "draft-1",
            description: "Read the brief draft.",
            variant: "customer-work",
            workReplyKey: "attempt:draft-1",
            createdAt: new Date(),
            metadata: { orderResultFileId: fileId },
            interaction: orderFileReviewInteraction(fileId, false),
          },
        },
      ],
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Preview Brief draft v1.txt" }),
    );
    expect(
      await screen.findByText(/Open question about the budget/),
    ).toBeTruthy();
    expect(mockOrderWorkContent).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: scope.orderId,
        artifactId: fileId,
      }),
    );
  });

  it("opens human support from a completed read-only order", () => {
    mockCustomerWork.mockReturnValue({
      data: {
        chatId: "chat-1",
        threadId: "thread-1",
        storeId: "store-1",
        taskId: "task-1",
        orderId: "order-1",
        status: "closed",
        discussionOnly: true,
        supportThreadId: "support-1",
      },
    });
    renderComponent("customer-work");
    expect(
      screen
        .getByRole("link", { name: "Contact support" })
        .getAttribute("href"),
    ).toBe("/en/social/chats/chat-1/threads/support-1");
    expect(screen.queryByRole("textbox", { name: "Message" })).toBeNull();
  });

  it("keeps the file attached to the message when the context sidebar closes", () => {
    mockCustomerWork.mockReturnValue({
      data: {
        chatId: "chat-1",
        threadId: "thread-1",
        storeId: "store-1",
        taskId: "task-1",
        orderId: "order-1",
        status: "active",
        assignment: "manager",
      },
    });
    mockOrderWorkRead.mockReturnValue({
      data: {
        orderId: "order-1",
        storeId: "store-1",
        taskId: "task-1",
        state: "awaiting-result",
        files: [{ id: "file-1", legacyMessageId: "version-1" }],
      },
    });
    renderComponent("default", {
      socialModuleThread: { id: "thread-1", hasCustomerWork: true },
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            variant: "customer-work",
            description: "Order is ready",
            metadata: { customerWorkResultVersionId: "version-1" },
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide right sidebar" }));
    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();

    expect(
      screen.getByRole("button", { name: "Download Order file preview" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /open version/i })).toBeNull();
  });

  it("ignores work that does not belong to the current chat and thread", () => {
    mockCustomerWork.mockReturnValue({
      data: { chatId: "other-chat", threadId: "thread-1", taskId: "task-1" },
    });
    renderComponent("default", {
      socialModuleThread: { id: "thread-1", hasCustomerWork: true },
    });
    expect(mockCustomerWork).toHaveBeenCalledWith({
      id: "subject-1",
      threadId: "thread-1",
    });
    expect(screen.queryByRole("button", { name: /right sidebar/i })).toBeNull();
  });
});

describe("Given: OpenRouter chat profile sidebar", () => {
  beforeEach(() => {
    resetChatComponentMocks();
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant knowledge.
   * When: the user types a slash prefix in the composer.
   * Then: the /learn command appears and selecting it inserts "@knowledge /learn ".
   */
  it("When: typing slash in a Knowledge chat Then: /learn can be selected", () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });

    fireEvent.change(textarea, {
      target: {
        value: "/",
      },
    });

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("/learn")).toBeTruthy();

    fireEvent.click(screen.getByText("Learn"));

    expect((textarea as HTMLTextAreaElement).value).toBe("@knowledge /learn ");
    expect(document.activeElement).toBe(textarea);
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant knowledge and slash commands are visible.
   * When: the user navigates the command picker with arrows and presses Tab.
   * Then: the active command is inserted into the composer.
   */
  it("When: selecting a slash command with arrows and Tab Then: it fills the composer", () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });

    fireEvent.change(textarea, {
      target: {
        value: "/le",
      },
    });

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("/learn")).toBeTruthy();
    expect(
      screen
        .getAllByRole("option")
        .filter((option) => option.className.includes("!bg-slate-100")),
    ).toHaveLength(1);

    fireEvent.keyDown(textarea, {
      key: "ArrowDown",
    });
    expect(
      screen
        .getAllByRole("option")
        .filter((option) => option.className.includes("!bg-slate-100")),
    ).toHaveLength(1);

    fireEvent.keyDown(textarea, {
      key: "Tab",
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("@knowledge /learn ");
    expect(document.activeElement).toBe(textarea);
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant knowledge and @knowledge is already selected.
   * When: the user types a slash command after @knowledge.
   * Then: the command picker opens and inserts the command without duplicating @knowledge.
   */
  it("When: typing slash after @knowledge Then: slash commands remain available", () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });

    fireEvent.change(textarea, {
      target: {
        value: "@knowledge /le",
      },
    });

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("/learn")).toBeTruthy();

    fireEvent.keyDown(textarea, {
      key: "Tab",
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("@knowledge /learn ");
    expect(document.activeElement).toBe(textarea);
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant default and no AI opponent.
   * When: the user types a slash prefix in the composer.
   * Then: Knowledge commands are not shown.
   */
  it("When: typing slash in a non-AI default chat Then: Knowledge commands are hidden", () => {
    renderComponent("default");

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: {
        value: "/",
      },
    });

    expect(screen.queryByText("Learn")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: a new default thread renders before an AI opponent is available.
   * When: the chat composer initializes profile skills.
   * Then: it does not call the AI-only skills endpoint for the requester's ordinary profile.
   */
  it("When: no AI opponent is resolved Then: the profile skills request stays disabled", () => {
    renderComponent("default");

    expect(mockProfileSkillFind).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSocialModuleProfileId: "missing-profile",
        reactQueryOptions: {
          enabled: false,
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant default and an AI opponent.
   * When: the user types a slash prefix in the composer.
   * Then: Knowledge commands are available because OpenRouter handles all AI chats.
   */
  it("When: typing slash in an AI default chat Then: Knowledge commands are visible", () => {
    renderComponent("default", {
      artificialIntelligenceOpponentProfile: aiOpponentProfile,
    });

    const textarea = screen.getByRole("textbox", { name: "Message" });

    fireEvent.change(textarea, {
      target: {
        value: "/",
      },
    });

    expect(screen.getByText("Learn")).toBeTruthy();
    expect(screen.getByText("/learn")).toBeTruthy();
  });

  /**
   * BDD Scenario
   * Given: the active chat has an artificial-intelligence opponent.
   * When: the composer is rendered.
   * Then: the multiline composer shows model selection and only offers Thinking for compatible models.
   */
  it("When: rendering an AI-opponent chat Then: the composer uses the expanded layout", () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });

    expect(textarea.getAttribute("rows")).toBe("4");
    expect(screen.getByRole("button", { name: "Attach files" })).toBeTruthy();
    expect(screen.getByLabelText("Select OpenRouter model")).toBeTruthy();
    expect(screen.queryByLabelText("Select OpenRouter thinking")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: the active chat does not have an artificial-intelligence opponent.
   * When: the composer is rendered.
   * Then: the same multiline input is shown without AI-only controls.
   */
  it("When: rendering a non-AI-opponent chat Then: the composer omits model controls", () => {
    renderComponent("knowledge", {
      knowledgeAssistantProfile: {
        id: "assistant-profile-1",
        slug: "human-profile",
        variant: "default",
        adminTitle: "Human Profile",
      },
    });

    const textarea = screen.getByRole("textbox", { name: "Message" });

    expect(textarea.getAttribute("rows")).toBe("4");
    expect(screen.queryByLabelText("Select OpenRouter model")).toBeNull();
    expect(screen.queryByLabelText("Select OpenRouter thinking")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: the active chat uses the existing composer.
   * When: the user attaches a file and submits a message.
   * Then: the current submit and attachment payload shape is preserved.
   */
  it("When: submitting with an attachment Then: the existing message flow is preserved", async () => {
    const { container } = renderComponent("knowledge");
    const textarea = screen.getByRole("textbox", { name: "Message" });
    const submitButton = screen.getByLabelText("Send message");
    const fileInput = container.querySelector("input[type=file]");
    const file = new File(["Knowledge notes"], "notes.md", {
      type: "text/markdown",
    });

    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [file],
      },
    });
    fireEvent.change(textarea, {
      target: {
        value: "Please store this",
      },
    });

    expect(screen.getByText("notes.md")).toBeTruthy();
    await waitFor(() => {
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
          data: {
            description: "Please store this",
            files: [file],
            metadata: {
              rbacAiReactionRequest: aiReactionRequest(),
            },
          },
        },
        expect.any(Object),
      );
    });
  });

  it.each(["default", "store-employee"] as const)(
    "attaches and sends a file with no caption in a %s chat",
    async (variant) => {
      const { container } = renderComponent(variant);
      const input =
        container.querySelector<HTMLInputElement>("input[type=file]")!;
      const openPicker = jest.spyOn(input, "click");
      fireEvent.click(screen.getByRole("button", { name: "Attach files" }));
      expect(openPicker).toHaveBeenCalled();
      expect(input.disabled).toBe(false);
      const font = new File(["sample"], "brand.ttf", { type: "font/ttf" });
      fireEvent.change(input, {
        target: { files: [font] },
      });
      fireEvent.click(screen.getByLabelText("Send message"));
      await waitFor(() =>
        expect(mockMessageCreateMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ files: [font], description: "" }),
          }),
          expect.any(Object),
        ),
      );
    },
  );

  /**
   * BDD Scenario
   * Given: two different files have the same name and are selected in separate picker operations.
   * When: the user adds the second file after the first one.
   * Then: the composer retains and submits both files as separate attachments.
   */
  it("When: adding same-named files separately Then: both attachments are retained", async () => {
    const { container } = renderComponent("knowledge");
    const textarea = screen.getByRole("textbox", { name: "Message" });
    const submitButton = screen.getByLabelText("Send message");
    const fileInput = container.querySelector("input[type=file]");
    const firstFile = new File(["First transcript"], "content.txt", {
      type: "text/plain",
      lastModified: 1,
    });
    const secondFile = new File(["Second, longer transcript"], "content.txt", {
      type: "text/plain",
      lastModified: 2,
    });

    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [firstFile],
      },
    });
    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [secondFile],
      },
    });

    expect(screen.getAllByText("content.txt")).toHaveLength(2);

    fireEvent.change(textarea, {
      target: {
        value: "Compare both transcripts",
      },
    });

    await waitFor(() => {
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            files: [firstFile, secondFile],
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the user selected a local file in the chat composer.
   * When: the user opens and removes the attached file before submit.
   * Then: the composer downloads the local file and omits the removed file from the payload.
   */
  it("When: managing a selected attachment Then: it can be downloaded and removed before submit", async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalOpen = window.open;
    const download = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const createObjectURL = jest.fn(() => {
      return "blob:notes-preview";
    });
    const revokeObjectURL = jest.fn();
    const open = jest.fn(() => {
      return {} as Window;
    });

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    Object.defineProperty(window, "open", {
      configurable: true,
      value: open,
    });
    jest.useFakeTimers();

    try {
      const { container } = renderComponent("knowledge");
      const textarea = screen.getByRole("textbox", { name: "Message" });
      const submitButton = screen.getByLabelText("Send message");
      const fileInput = container.querySelector("input[type=file]");
      const file = new File(["Knowledge notes"], "notes.md", {
        type: "text/markdown",
      });

      expect(fileInput).toBeTruthy();

      fireEvent.change(fileInput as HTMLInputElement, {
        target: {
          files: [file],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: "Preview notes.md" }));
      fireEvent.click(screen.getByRole("button", { name: "Download" }));

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(open).not.toHaveBeenCalled();
      expect(download.mock.instances[0]).toMatchObject({
        href: "blob:notes-preview",
        download: "notes.md",
      });
      jest.runOnlyPendingTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:notes-preview");
      jest.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      fireEvent.click(screen.getByLabelText("Remove attached file notes.md"));

      expect(screen.queryByText("notes.md")).toBeNull();

      fireEvent.change(textarea, {
        target: {
          value: "Please store this without attachments",
        },
      });

      await waitFor(() => {
        expect((submitButton as HTMLButtonElement).disabled).toBe(false);
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMessageCreateMutate).toHaveBeenCalledWith(
          {
            id: "subject-1",
            socialModuleProfileId: "profile-1",
            socialModuleChatId: "chat-1",
            socialModuleThreadId: "thread-1",
            data: {
              description: "Please store this without attachments",
              files: undefined,
              metadata: {
                rbacAiReactionRequest: aiReactionRequest(),
              },
            },
          },
          expect.any(Object),
        );
      });
    } finally {
      jest.useRealTimers();
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectURL,
      });
      download.mockRestore();
      Object.defineProperty(window, "open", {
        configurable: true,
        value: originalOpen,
      });
    }
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message starts with @knowledge /learn.
   * When: the message is created from the composer.
   * Then: Knowledge intent and the AI profile are persisted in that one message request.
   */
  it("When: creating a @knowledge /learn message Then: it persists Knowledge learning intent", async () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "@knowledge /learn Stored context",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              knowledgeMention: {
                slug: "knowledge",
                useKnowledgeSearch: true,
              },
              rbacAiReactionRequest: aiReactionRequest({
                useKnowledgeSearch: true,
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message is submitted from the composer.
   * When: the frontend records the request.
   * Then: it performs only create-message and leaves AI orchestration to the backend.
   */
  it("When: an AI message is submitted Then: the frontend performs only create-message", async () => {
    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledTimes(1);
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              rbacAiReactionRequest: aiReactionRequest(),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat composer has OpenRouter model and Thinking controls.
   * When: the user selects a concrete model and high Thinking before sending.
   * Then: those values are persisted with the message for backend execution.
   */
  it("When: selecting model and Thinking Then: submit persists the selected parameters", async () => {
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
      MouseEvent;
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "What should we answer?",
      });
    });

    renderComponent("knowledge");

    fireEvent.click(screen.getByLabelText("Select OpenRouter model"));
    fireEvent.click(await screen.findByText("GPT-5.2"));

    await waitFor(() => {
      expect(mockThreadUpdateMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
          data: {
            openRouterModelId: "openai/gpt-5.2",
          },
        },
        expect.any(Object),
      );
    });

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter thinking"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("High"));

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              rbacAiReactionRequest: aiReactionRequest({
                modelId: "openai/gpt-5.2",
                reasoning: "high",
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the selected model accepts only high and low reasoning and makes reasoning mandatory.
   * When: the user opens the Thinking selector.
   * Then: only Auto and the model's accepted efforts are offered, without Off or unsupported levels.
   */
  it("When: opening Thinking Then: only model-supported efforts are listed", async () => {
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
      MouseEvent;

    renderComponent("knowledge");

    fireEvent.click(screen.getByLabelText("Select OpenRouter model"));
    fireEvent.click(await screen.findByText("GPT-5.2"));
    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter thinking"), {
      button: 0,
      ctrlKey: false,
    });

    expect(
      await screen.findByRole("menuitemradio", { name: "Auto" }),
    ).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "High" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Low" })).toBeTruthy();
    expect(screen.queryByRole("menuitemradio", { name: "Maximum" })).toBeNull();
    expect(
      screen.queryByRole("menuitemradio", { name: "Extra High" }),
    ).toBeNull();
    expect(screen.queryByRole("menuitemradio", { name: "Medium" })).toBeNull();
    expect(screen.queryByRole("menuitemradio", { name: "Minimal" })).toBeNull();
    expect(screen.queryByRole("menuitemradio", { name: "Off" })).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: the active thread persisted a concrete OpenRouter model.
   * When: the chat composer mounts after a page reload.
   * Then: that model is restored instead of resetting to Auto.
   */
  it("When: composer reloads Then: thread model preference is restored", async () => {
    renderComponent("default", {
      artificialIntelligenceOpponentProfile: aiOpponentProfile,
      socialModuleThread: {
        id: "thread-1",
        metadata: {
          rbacAiThreadPreferences: {
            version: 1,
            modelId: "openai/gpt-5.2",
          },
        },
      },
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText("Select OpenRouter model").textContent,
      ).toContain("GPT-5.2");
    });
    expect(mockThreadUpdateMutate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: OpenRouter live model metadata marks a selected model as not supporting reasoning.
   * When: the user selects that concrete model after choosing a Thinking effort.
   * Then: the Thinking control is hidden and the request falls back to reasoning auto.
   */
  it("When: selected model does not support reasoning Then: Thinking is hidden", async () => {
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
      MouseEvent;
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "What should we answer?",
      });
    });

    renderComponent("knowledge");

    fireEvent.click(screen.getByLabelText("Select OpenRouter model"));
    fireEvent.click(await screen.findByText("GPT-5.2"));

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter thinking"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("High"));

    fireEvent.click(screen.getByLabelText("Select OpenRouter model"));
    fireEvent.click(await screen.findByText("GPT Basic"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Select OpenRouter thinking")).toBeNull();
    });

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              rbacAiReactionRequest: aiReactionRequest({
                modelId: "openai/gpt-basic",
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the OpenRouter model dropdown contains live model names and slugs.
   * When: the user searches by slug and favorites the matching model.
   * Then: the model remains selectable and the favorites mutation stores its id.
   */
  it("When: searching and favoriting a model Then: the model id is stored", async () => {
    (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent =
      MouseEvent;

    renderComponent("knowledge");

    fireEvent.click(screen.getByLabelText("Select OpenRouter model"));
    fireEvent.change(
      await screen.findByRole("searchbox", { name: "Search models" }),
      {
        target: {
          value: "openai/gpt-5.2",
        },
      },
    );

    expect(await screen.findByText("GPT-5.2")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Favorite GPT-5.2", pressed: false }),
    );

    await waitFor(() => {
      expect(mockOpenRouterModelFavoriteUpdateMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          data: { favoriteModelIds: ["openai/gpt-5.2"] },
        },
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the Knowledge assistant profile has a linked skill.
   * When: the user invokes that skill with / and submits a Knowledge chat message.
   * Then: the selected skill id is persisted in the message reaction envelope.
   */
  it("When: invoking a linked skill Then: Knowledge generation receives selected skill ids", async () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "Brief Writer",
        adminTitle: "Brief Writer",
        slug: "brief-writer",
        description: "Write a concise brief.",
      },
    ];
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "/brief-writer What should we answer?",
      });
    });

    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "/br",
      },
    });
    fireEvent.click(screen.getByText("Brief Writer"));

    expect((textarea as HTMLTextAreaElement).value).toBe("/brief-writer ");
    expect(screen.getByLabelText("Remove brief-writer")).toBeTruthy();

    fireEvent.change(textarea, {
      target: {
        value: "/brief-writer What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              socialSkillMentions: [
                {
                  skillId: "skill-1",
                  slug: "brief-writer",
                },
              ],
              rbacAiReactionRequest: aiReactionRequest({
                skillIds: ["skill-1"],
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the user selected a linked skill through the / picker.
   * When: the user removes that /skill command from the composer text.
   * Then: the selected skill badge is removed and the OpenRouter reaction does not receive stale skill ids.
   */
  it("When: removing a typed skill command Then: the selected skill badge is removed", async () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "Brief Writer",
        adminTitle: "Brief Writer",
        slug: "brief-writer",
        description: "Write a concise brief.",
      },
    ];
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "What should we answer?",
      });
    });

    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "/br",
      },
    });
    fireEvent.click(screen.getByText("Brief Writer"));

    expect(screen.getByLabelText("Remove brief-writer")).toBeTruthy();

    fireEvent.change(textarea, {
      target: {
        value: "What should we answer?",
      },
    });

    await waitFor(() => {
      expect(screen.queryByLabelText("Remove brief-writer")).toBeNull();
    });

    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              rbacAiReactionRequest: aiReactionRequest(),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the slash picker contains /learn and a linked skill.
   * When: the user navigates the picker with ArrowDown and presses Tab.
   * Then: the active slash option is inserted into the composer.
   */
  it("When: selecting a slash option with arrows and Tab Then: it fills the composer", () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "Knowledge Helper",
        adminTitle: "Knowledge Helper",
        slug: "knowledge-helper",
        description: "Use knowledge context.",
      },
    ];

    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "/",
      },
    });

    expect(screen.getByText("/learn")).toBeTruthy();
    expect(screen.getByText("Knowledge Helper")).toBeTruthy();
    expect(
      screen
        .getAllByRole("option")
        .filter((option) => option.className.includes("!bg-slate-100")),
    ).toHaveLength(1);

    fireEvent.keyDown(textarea, {
      key: "ArrowDown",
    });
    const optionsAfterArrowDown = screen.getAllByRole("option");
    expect(
      optionsAfterArrowDown.filter((option) => {
        return option.className.includes("!bg-slate-100");
      }),
    ).toHaveLength(1);
    expect(optionsAfterArrowDown[1].className).toContain("!bg-slate-100");

    fireEvent.keyDown(textarea, {
      key: "Tab",
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("/knowledge-helper ");
    expect(document.activeElement).toBe(textarea);
  });

  /**
   * BDD Scenario
   * Given: a default chat has chat-gpt-1 as an AI opponent with a linked skill.
   * When: the user opens the slash picker.
   * Then: the skill from chat-gpt-1 is shown in that default chat.
   */
  it("When: opening slash commands in an AI default chat Then: chat-gpt-1 skills are shown", () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "RAG Helper",
        adminTitle: "RAG Helper",
        slug: "rag-helper",
        description: "Use RAG context.",
      },
    ];

    renderComponent("default", {
      artificialIntelligenceOpponentProfile: aiOpponentProfile,
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: {
        value: "/",
      },
    });

    expect(screen.getByText("RAG Helper")).toBeTruthy();
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant knowledge.
   * When: the user mentions @knowledge and submits a message.
   * Then: the message reaction envelope stores an explicit RAG search flag.
   */
  it("When: mentioning @knowledge Then: Knowledge generation receives the RAG flag", async () => {
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "@knowledge What should we answer?",
      });
    });

    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "@kn",
      },
    });
    fireEvent.click(screen.getByText("Knowledge"));

    expect((textarea as HTMLTextAreaElement).value).toBe("@knowledge ");
    expect(screen.getAllByText("@knowledge").length).toBeGreaterThan(0);

    fireEvent.change(textarea, {
      target: {
        value: "@knowledge What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              knowledgeMention: {
                slug: "knowledge",
                useKnowledgeSearch: true,
              },
              rbacAiReactionRequest: aiReactionRequest({
                useKnowledgeSearch: true,
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: the Knowledge assistant profile has a linked skill.
   * When: the user mentions @knowledge and invokes a linked skill.
   * Then: the message reaction envelope combines RAG search with selected skill instructions.
   */
  it("When: mentioning @knowledge and invoking a linked skill Then: RAG and selected skills are combined", async () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "Brief Writer",
        adminTitle: "Brief Writer",
        slug: "brief-writer",
        description: "Write a concise brief.",
      },
    ];
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "@knowledge /brief-writer What should we answer?",
      });
    });

    renderComponent("knowledge");

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, {
      target: {
        value: "@kn",
      },
    });
    fireEvent.click(screen.getByText("Knowledge"));
    fireEvent.change(textarea, {
      target: {
        value: "@knowledge /br",
      },
    });
    fireEvent.click(screen.getByText("Brief Writer"));

    expect((textarea as HTMLTextAreaElement).value).toBe(
      "@knowledge /brief-writer ",
    );
    expect(screen.getByText("@knowledge")).toBeTruthy();
    expect(screen.getByLabelText("Remove brief-writer")).toBeTruthy();

    fireEvent.change(textarea, {
      target: {
        value: "@knowledge /brief-writer What should we answer?",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              socialSkillMentions: [
                {
                  skillId: "skill-1",
                  slug: "brief-writer",
                },
              ],
              knowledgeMention: {
                slug: "knowledge",
                useKnowledgeSearch: true,
              },
              rbacAiReactionRequest: aiReactionRequest({
                skillIds: ["skill-1"],
                useKnowledgeSearch: true,
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: skill creation moved to the social.profile sidebar.
   * When: the chat composer renders.
   * Then: the composer does not expose a standalone New skill action.
   */
  it("When: rendering the composer Then: it does not expose New skill", () => {
    renderComponent("knowledge");

    expect(screen.queryByLabelText("New skill")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: the skill slug field contains an exact repeated slug.
   * When: the user creates a skill from the profile sidebar.
   * Then: social.skill is created with a normalized single slug.
   */
  it("When: creating a skill with a repeated slug Then: it stores a single normalized slug", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        adminTitle: "Chat GPT 1",
        variant: "artificial-intelligence",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "New skill for chat-gpt-1" }),
    );
    expect(screen.queryByText("Status")).toBeNull();
    fireEvent.change(screen.getByLabelText("Title"), {
      target: {
        value: "Support Tone",
      },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: {
        value: "support-tonesupport-tonesupport-tone",
      },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: {
        value: "Answer with a concise support tone.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }));

    await waitFor(() => {
      expect(mockSocialSkillCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          data: expect.objectContaining({
            slug: "support-tone",
          }),
        }),
      );
    });
    expect(
      mockSocialSkillCreateMutateAsync.mock.calls[0][0].data,
    ).not.toHaveProperty("status");
  });

  /**
   * BDD Scenario
   * Given: the Knowledge assistant profile has a linked skill.
   * When: the user opens the / picker and selects the skill.
   * Then: the composer exposes only mention selection and removal, not skill editing.
   */
  it("When: using a linked skill in the composer Then: it does not expose skill editing", () => {
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        variant: "default",
        className: "",
        title: "Brief Writer",
        adminTitle: "Brief Writer",
        slug: "brief-writer",
        description: "Write a concise brief.",
      },
    ];

    renderComponent("knowledge");

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: {
        value: "/br",
      },
    });

    expect(screen.getByText("Brief Writer")).toBeTruthy();
    expect(screen.queryByLabelText("Edit brief-writer")).toBeNull();

    fireEvent.click(screen.getByText("Brief Writer"));

    expect(screen.getByLabelText("Remove brief-writer")).toBeTruthy();
    expect(screen.queryByLabelText("Edit brief-writer")).toBeNull();
    expect(mockSocialSkillUpdateMutateAsync).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a default chat without an AI opponent starts with /learn.
   * When: the message is created from the composer.
   * Then: the ordinary message has no RBAC AI reaction envelope.
   */
  it("When: creating /learn in a non-AI default chat Then: it stores no AI reaction intent", async () => {
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "/learn Stored context",
      });
    });

    renderComponent("default");

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: {
        value: "/learn Stored context",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            metadata: expect.anything(),
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a default chat has an AI opponent with OpenRouter support.
   * When: a message starts with @knowledge /learn.
   * Then: the selected AI profile and Knowledge intent are stored with the message.
   */
  it("When: creating @knowledge /learn in an AI default chat Then: it persists OpenRouter learning intent", async () => {
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "@knowledge /learn Stored context",
      });
    });

    renderComponent("default", {
      artificialIntelligenceOpponentProfile: aiOpponentProfile,
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: {
        value: "@knowledge /learn Stored context",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {
              knowledgeMention: {
                slug: "knowledge",
                useKnowledgeSearch: true,
              },
              rbacAiReactionRequest: aiReactionRequest({
                useKnowledgeSearch: true,
              }),
            },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message was sent by a profile with linked skills and documents.
   * When: the user clicks the profile name in the timeline.
   * Then: the profile sidebar shows profile details, skills, and knowledge.
   */
  it("When: clicking a profile name Then: profile skills and knowledge are shown", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
        title: {
          en: "Chat GPT 1",
        },
        subtitle: {
          en: "AI assistant",
        },
        description: {
          en: "Assistant details",
        },
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        title: "YouTube Description",
        adminTitle: "YouTube Description",
        slug: "youtube-description",
        description: "Write YouTube descriptions.",
      },
    ];
    mockChatComponentState.knowledgeSources = [
      {
        id: "document-1",
        title: "Policy",
        content: "Policy details",
        description: null,
        indexedContentHash: "hash-1",
        slug: "policy",
        adminTitle: "Policy",
        variant: "default",
        className: null,
        status: "published",
        summary: "",
        tags: [],
        metadata: {},
        contentHash: "hash-1",
        lastIndexedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ];

    renderComponent("knowledge", {
      socialModuleThread: {
        id: "thread-1",
        linkedProducts: [
          { id: "product-1", slug: "cover", title: { en: "Cover" } },
        ],
      },
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide right sidebar" }));
    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();

    const sender = await screen.findByRole("button", { name: "chat-gpt-1" });
    fireEvent.click(sender);
    const profile = within(
      screen.getByRole("dialog", { name: "Profile details" }),
    );
    expect(profile.getByRole("heading", { name: "Chat GPT 1" })).toBeTruthy();
    expect(profile.getByText("YouTube Description")).toBeTruthy();
    expect(profile.getByText("Policy")).toBeTruthy();
    fireEvent.click(profile.getByRole("button", { name: "Close profile" }));
    await waitFor(() => expect(document.activeElement).toBe(sender));
    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    const context = screen.getByRole("complementary", { name: "Context" });
    expect(within(context).getByRole("link", { name: "Cover" })).toBeTruthy();
    expect(
      within(context).queryByRole("heading", { name: "Chat GPT 1" }),
    ).toBeNull();
  });

  it("keeps the profile sheet accessible on mobile", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = jest.fn((query) => ({
      matches: query === "(width < 80rem)",
    })) as unknown as typeof window.matchMedia;
    try {
      mockChatComponentState.profiles = [aiOpponentProfile];
      renderComponent("knowledge", {
        socialModuleMessagesAndActionsQuery: [
          {
            type: "message",
            data: {
              id: "message-1",
              authorProfileIds: [aiOpponentProfile.id],
              description: "Hello",
              createdAt: new Date("2026-01-01T10:00:00.000Z"),
            },
          },
        ],
      });
      fireEvent.click(
        screen.getByRole("button", { name: aiOpponentProfile.slug }),
      );
      const sheet = screen.getByRole("dialog", { name: "Profile details" });
      expect(
        within(sheet).getByRole("heading", {
          name: aiOpponentProfile.adminTitle,
        }),
      ).toBeTruthy();
      fireEvent.click(
        within(sheet).getByRole("button", { name: "Close profile" }),
      );
      expect(
        screen.queryByRole("dialog", { name: "Profile details" }),
      ).toBeNull();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  /**
   * BDD Scenario
   * Given: a chat-local AI profile is opened from a message but no assistant profile prop is available.
   * When: the user opens that profile in the sidebar.
   * Then: profile, skill, and knowledge edit controls are still shown for the AI profile.
   */
  it("When: opening an AI profile without assistant props Then: sidebar edit controls remain available", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];

    renderComponent("knowledge", {
      artificialIntelligenceOpponentProfile: null,
      knowledgeAssistantProfile: null,
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));

    expect(screen.getByLabelText("Edit profile chat-gpt-1")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "New skill for chat-gpt-1" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "New knowledge for chat-gpt-1" }),
    ).toBeTruthy();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar shows a linked skill.
   * When: the user clicks the skill in that sidebar.
   * Then: the existing social.skill edit form opens for that skill.
   */
  it("When: clicking a profile sidebar skill Then: the skill edit form opens", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];
    mockChatComponentState.profileSkillRelations = [
      {
        id: "profile-skill-1",
        profileId: "assistant-profile-1",
        skillId: "skill-1",
      },
    ];
    mockChatComponentState.socialSkills = [
      {
        id: "skill-1",
        variant: "default",
        className: "",
        title: "YouTube Description",
        adminTitle: "YouTube Description",
        slug: "youtube-description",
        description: "Write YouTube descriptions.",
      },
    ];

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "YouTube Description" }),
    );

    expect(screen.getByText("Edit Skill")).toBeTruthy();
    expect(screen.getByDisplayValue("YouTube Description")).toBeTruthy();
    expect(screen.getByDisplayValue("youtube-description")).toBeTruthy();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar is opened for an AI profile.
   * When: the user creates a skill from that sidebar.
   * Then: the new social.skill is linked to the sidebar profile, not the active chat profile.
   */
  it("When: creating a skill from profile sidebar Then: it links to the sidebar profile", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "New skill for chat-gpt-1" }),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: {
        value: "Sidebar Skill",
      },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: {
        value: "sidebar-skill",
      },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: {
        value: "Created from the sidebar profile.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }));

    await waitFor(() => {
      expect(mockSocialSkillCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          data: expect.objectContaining({
            title: "Sidebar Skill",
            slug: "sidebar-skill",
            description: "Created from the sidebar profile.",
          }),
        }),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar is opened for an AI profile.
   * When: the user creates a Knowledge Source from that sidebar.
   * Then: the RBAC scoped create endpoint receives the sidebar profile scope.
   */
  it("When: creating Knowledge from profile sidebar Then: it links to the sidebar profile", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "New knowledge for chat-gpt-1" }),
    );

    expect(screen.getByText("Create Knowledge")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Delete knowledge" }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText("Knowledge title"), {
      target: {
        value: "Sidebar Knowledge",
      },
    });
    fireEvent.change(screen.getByLabelText("Knowledge content"), {
      target: {
        value: "Created from the sidebar profile.",
      },
    });
    mockKnowledgeSourceCreateMutate.mockImplementationOnce(
      (_payload, callbacks) => callbacks.onError({ status: 503 }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create knowledge" }));

    await waitFor(() => {
      expect(mockKnowledgeSourceCreateMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          data: {
            title: "Sidebar Knowledge",
            content: "Created from the sidebar profile.",
            orderIndex: 0,
            operationKey: expect.any(String),
          },
        },
        expect.any(Object),
      );
    });
    expect(screen.getByRole("alert").textContent).toMatch(
      /indexing is temporarily unavailable/,
    );
    expect(screen.getByLabelText("Knowledge content")).toHaveProperty(
      "value",
      "Created from the sidebar profile.",
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    const requestKey =
      mockKnowledgeSourceCreateMutate.mock.calls[0][0].data.operationKey;
    fireEvent.click(screen.getByRole("button", { name: "Create knowledge" }));
    expect(
      mockKnowledgeSourceCreateMutate.mock.calls[1][0].data.operationKey,
    ).toBe(requestKey);
  });

  it("attaches files selected before saving to the new source in the same profile", async () => {
    const profile = {
      id: "assistant-profile-1",
      slug: "designer",
      variant: "artificial-intelligence",
      adminTitle: "Designer",
    };
    mockChatComponentState.profiles = [profile];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: profile.id,
        messageId: "message-1",
      },
    ];
    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date(),
          },
        },
      ],
    });
    fireEvent.click(await screen.findByRole("button", { name: "designer" }));
    fireEvent.click(
      screen.getByRole("button", { name: "New knowledge for designer" }),
    );
    const editor = within(
      screen.getByRole("dialog", { name: "Create Knowledge" }),
    );
    const content = "## Composition\n\nThe package fills the right half.";
    fireEvent.change(editor.getByLabelText("Knowledge title"), {
      target: { value: "Composition" },
    });
    fireEvent.change(editor.getByLabelText("Knowledge content"), {
      target: { value: content },
    });
    const file = new File(["image"], "reference.png", { type: "image/png" });
    fireEvent.change(editor.getByLabelText("Knowledge files"), {
      target: { files: [file] },
    });
    expect(mockAttachKnowledgeFiles).not.toHaveBeenCalled();
    fireEvent.click(editor.getByRole("button", { name: "Create knowledge" }));
    await waitFor(() =>
      expect(mockKnowledgeSourceCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          targetSocialModuleProfileId: profile.id,
          data: expect.objectContaining({ files: [file], content }),
        }),
        expect.any(Object),
      ),
    );
    expect(mockAttachKnowledgeFiles).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar shows a linked Knowledge Source.
   * When: the user confirms deleting the document.
   * Then: the RBAC scoped delete endpoint receives the selected profile scope and the dialog closes.
   */
  it("When: deleting a profile Knowledge Source Then: it hard-deletes in that profile scope", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];
    mockChatComponentState.knowledgeSources = [
      {
        id: "document-1",
        title: "Temporary Knowledge",
        content: "Temporary details",
        description: null,
        indexedContentHash: "hash-1",
        slug: "temporary-knowledge",
        adminTitle: "Temporary Knowledge",
        variant: "default",
        className: null,
        status: "indexed",
        summary: "",
        tags: [],
        metadata: {},
        contentHash: "hash-1",
        lastIndexedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ];

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Temporary Knowledge" }),
    );

    expect(screen.getByText("Edit Knowledge")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete knowledge" }));
    expect(screen.getByText("Delete Knowledge")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete Knowledge" }));

    await waitFor(() => {
      expect(mockKnowledgeSourceDeleteMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: "assistant-profile-1",
        knowledgeModuleSourceId: "document-1",
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Edit Knowledge")).toBeNull();
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar shows linked Knowledge Sources.
   * When: the user selects a document, edits it, saves it, and reindexes it.
   * Then: the RBAC scoped Knowledge update and reindex endpoints receive the selected profile scope.
   */
  it("When: editing a profile Knowledge Source Then: it saves and reindexes in that profile scope", async () => {
    mockChatComponentState.profiles = [
      {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
        adminTitle: "Chat GPT 1",
      },
    ];
    mockChatComponentState.profileMessageRelations = [
      {
        id: "profile-message-1",
        profileId: "assistant-profile-1",
        messageId: "message-1",
      },
    ];
    mockChatComponentState.knowledgeSources = [
      {
        id: "document-1",
        title: "Policy",
        content: "Policy details",
        description: null,
        indexedContentHash: "hash-1",
        slug: "policy",
        adminTitle: "Policy",
        variant: "default",
        className: null,
        status: "published",
        summary: "",
        tags: [],
        metadata: {},
        contentHash: "hash-1",
        lastIndexedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ];
    mockKnowledgeSourceUpdateMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({
        ...mockChatComponentState.knowledgeSources[0],
        title: payload.data.title,
        content: payload.data.content,
      });
    });

    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Hello",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    fireEvent.click(await screen.findByRole("button", { name: "chat-gpt-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Policy" }));

    expect(screen.getByText("Edit Knowledge")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Knowledge title"), {
      target: {
        value: "Policy updated",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));

    await waitFor(() => {
      expect(mockKnowledgeSourceUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          knowledgeModuleSourceId: "document-1",
          data: expect.objectContaining({
            title: "Policy updated",
          }),
        }),
        expect.any(Object),
      );
    });

    expect(
      screen.queryByRole("button", { name: "Reindex knowledge" }),
    ).toBeNull();
    expect(mockKnowledgeReindexDocumentMutateAsync).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a default chat is rendered.
   * When: the message list loads.
   * Then: no profile sidebar is opened automatically.
   */
  it("When: rendering a default chat Then: profile sidebar is not opened", () => {
    renderComponent("default");

    expect(screen.queryByText("Knowledge")).toBeNull();
  });

  it("creates personal knowledge and edits a remembered order note from the sender card", () => {
    const manager = {
      id: "profile-1",
      slug: "manager-record",
      adminTitle: "Generated profile label",
      variant: "default",
    };
    const employee = {
      id: "employee-profile",
      slug: "alice",
      adminTitle: "Alice",
      variant: "artificial-intelligence",
    };
    mockChatComponentState.profiles = [manager, employee];
    mockChatComponentState.knowledgeSources = [
      {
        id: "note",
        slug: "personal-note",
        title: "Personal note",
        variant: "customer-memory",
        editable: true,
        content: "Please remember the delivery hours.",
        contentHash: "h",
        indexedContentHash: null,
      },
      {
        id: "shared",
        slug: "shared-document",
        title: "Shared document",
        content: "Shared material",
        editable: false,
      },
    ];
    const view = renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: employee,
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "manager-message",
            description: "Hello",
            createdAt: new Date(),
            authorProfiles: [
              {
                id: manager.id,
                title: { en: "rogwild" },
                subtitle: {},
                avatar: null,
              },
            ],
          },
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: manager.slug }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Profile details" }),
    );
    const heading = dialog.getByRole("heading", { name: "rogwild" });
    expect(heading.closest("aside")?.dataset.profileId).toBe(manager.id);
    fireEvent.click(dialog.getByRole("button", { name: "Personal note" }));
    const note = within(screen.getByRole("dialog", { name: "Edit Knowledge" }));
    expect(
      (note.getByLabelText("Knowledge content") as HTMLTextAreaElement).value,
    ).toBe("Please remember the delivery hours.");
    expect(note.queryByRole("button", { name: "Delete knowledge" })).toBeNull();
    expect(
      note.queryByRole("button", { name: "Reindex knowledge" }),
    ).toBeNull();
    expect(mockKnowledgeSourceUpdateMutate).not.toHaveBeenCalled();
    mockKnowledgeSourceUpdateMutate.mockImplementationOnce(
      (_payload, callbacks) => callbacks.onError({ status: 503 }),
    );
    fireEvent.click(note.getByRole("button", { name: "Save knowledge" }));
    expect(mockKnowledgeSourceUpdateMutate.mock.calls[0][0].data).toEqual({
      title: "Personal note",
      content: "Please remember the delivery hours.",
      expectedContentHash: "h",
      expectedTitle: "Personal note",
    });
    expect(note.getByRole("alert").textContent).toMatch(
      /indexing is temporarily unavailable/,
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    mockChatComponentState.knowledgeSources =
      mockChatComponentState.knowledgeSources.map((source) =>
        source.id === "note"
          ? {
              ...source,
              title: "Renamed in a second tab",
              contentHash: "later-version",
            }
          : source,
      );
    view.rerenderThread({ id: "thread-1", metadata: {} });
    expect(
      (note.getByLabelText("Knowledge title") as HTMLInputElement).value,
    ).toBe("Personal note");
    fireEvent.change(note.getByLabelText("Knowledge title"), {
      target: { value: "Delivery hours" },
    });
    fireEvent.change(note.getByLabelText("Knowledge content"), {
      target: { value: "After 6 pm." },
    });
    mockKnowledgeSourceUpdateMutate.mockImplementationOnce(
      (_payload, callbacks) => callbacks.onError({ status: 409 }),
    );
    fireEvent.click(note.getByRole("button", { name: "Save knowledge" }));
    expect(mockKnowledgeSourceUpdateMutate).toHaveBeenCalledWith(
      {
        id: "subject-1",
        socialModuleProfileId: manager.id,
        personal: true,
        knowledgeModuleSourceId: "note",
        data: {
          title: "Delivery hours",
          content: "After 6 pm.",
          expectedContentHash: "h",
          expectedTitle: "Personal note",
        },
      },
      expect.any(Object),
    );
    expect(note.getByRole("alert").textContent).toMatch(/source has changed/);
    expect(note.getByRole("button", { name: "Save knowledge" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(note.getByLabelText("Knowledge content")).toHaveProperty(
      "value",
      "After 6 pm.",
    );
    fireEvent.click(note.getByRole("button", { name: "Close" }));
    fireEvent.click(dialog.getByRole("button", { name: "Shared document" }));
    const shared = within(
      screen.getByRole("dialog", { name: "Shared document" }),
    );
    expect(shared.getByText("Shared material")).toBeTruthy();
    expect(shared.queryByRole("textbox")).toBeNull();
    fireEvent.click(shared.getByRole("button", { name: "Close" }));
    fireEvent.click(dialog.getByRole("button", { name: /New knowledge/ }));
    const create = within(
      screen.getByRole("dialog", { name: "Create Knowledge" }),
    );
    fireEvent.change(create.getByLabelText("Knowledge title"), {
      target: { value: "Delivery" },
    });
    fireEvent.change(create.getByLabelText("Knowledge content"), {
      target: { value: "My preferences" },
    });
    fireEvent.click(create.getByRole("button", { name: "Create knowledge" }));
    expect(mockKnowledgeSourceCreateMutate).toHaveBeenCalledWith(
      {
        id: "subject-1",
        socialModuleProfileId: manager.id,
        personal: true,
        data: {
          title: "Delivery",
          content: "My preferences",
          orderIndex: 2,
          operationKey: expect.any(String),
        },
      },
      expect.any(Object),
    );
    expect(screen.getByRole("dialog", { name: "Edit Knowledge" })).toBeTruthy();
    expect(dialog.queryByRole("button", { name: /Edit profile/ })).toBeNull();
  });

  it("keeps cached personal sources out of a fellow participant's card", () => {
    const peer = {
      id: "other-person",
      slug: "teammate",
      variant: "default",
      adminTitle: "Teammate",
    };
    mockChatComponentState.profiles = [peer];
    mockChatComponentState.knowledgeSources = [
      { id: "private", title: "Private note", content: "Owner only" },
    ];
    renderComponent("store-employee", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "peer-message",
            description: "Hello",
            createdAt: new Date(),
            authorProfiles: [
              {
                id: peer.id,
                title: { en: "Teammate" },
                subtitle: {},
                avatar: null,
              },
            ],
          },
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: peer.slug }));
    const card = within(
      screen.getByRole("dialog", { name: "Profile details" }),
    );
    expect(card.queryByText("Private note")).toBeNull();
    const { api } = jest.requireMock("@sps/rbac/models/subject/sdk/client");
    expect(
      api.socialModuleProfileFindByIdKnowledgeSourceFind,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        socialModuleProfileId: "profile-1",
        personal: true,
        reactQueryOptions: { enabled: false },
      }),
    );
  });

  it("opens the selected participant from the empty employee conversation", () => {
    const employee = {
      id: "employee-profile",
      slug: "alice",
      variant: "artificial-intelligence",
      adminTitle: "Alice",
    };
    mockChatComponentState.profiles = [
      {
        id: "profile-1",
        slug: "manager",
        variant: "default",
        adminTitle: "Manager",
      },
      employee,
    ];
    renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: employee,
      socialModuleThread: {
        id: "thread-1",
        metadata: {},
        hasCustomerWork: true,
      },
    });
    expect(
      screen.queryByRole("button", { name: "Show right sidebar" }),
    ).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Open Manager profile" }),
    ).toBeNull();
    expect(screen.getAllByText("Alice")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Open Alice profile" }));
    const alice = within(
      screen.getByRole("dialog", { name: "Profile details" }),
    );
    expect(alice.getByRole("heading", { name: "Alice" })).toBeTruthy();
    expect(
      alice.getByRole("button", { name: "New knowledge for alice" }),
    ).toBeTruthy();
    expect(
      alice.getByRole("button", { name: "New skill for alice" }),
    ).toBeTruthy();
    fireEvent.click(alice.getByRole("button", { name: "Close profile" }));
    expect(screen.getByRole("button", { name: "Attach files" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "/" },
    });
    expect(screen.queryByText("/learn")).toBeNull();
  });

  it("keeps the discussion files open when viewing and closing an employee profile", () => {
    renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: {
        id: "employee-profile",
        slug: "alice",
        variant: "artificial-intelligence",
        adminTitle: "Alice",
      },
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Training material",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
            privateAttachments: [{ id: "input-file", name: "Training.pdf" }],
          },
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Show right sidebar" }));
    const sidebar = within(
      screen.getByRole("complementary", { name: "Context" }),
    );
    expect(sidebar.getByRole("heading", { name: "Files" })).toBeTruthy();
    expect(
      sidebar.getByRole("button", { name: "Preview Training.pdf" }),
    ).toBeTruthy();
    expect(
      sidebar.queryByRole("button", { name: "Edit profile alice" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open Alice profile" }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Profile details" }),
    );
    expect(
      dialog.getByRole("button", { name: "Edit profile alice" }),
    ).toBeTruthy();
    fireEvent.click(dialog.getByRole("button", { name: "Close profile" }));
    expect(sidebar.getByRole("heading", { name: "Files" })).toBeTruthy();
  });

  it("saves the employee's MCP servers through the operator's private chat", async () => {
    const employee = {
      id: "employee-profile",
      slug: "alice",
      variant: "artificial-intelligence",
      adminTitle: "Alice",
      allowedMcpServerIds: [],
    };
    mockProfileUpdateMutateAsync.mockResolvedValue({
      ...employee,
      allowedMcpServerIds: ["singlepagestartup"],
    });
    renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: employee,
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Alice profile" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Edit MCP servers for alice" }),
    );
    const editor = within(
      screen.getByRole("dialog", { name: "Edit MCP Servers" }),
    );
    fireEvent.click(
      editor.getByRole("checkbox", { name: "SinglePageStartup MCP" }),
    );
    fireEvent.click(editor.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockProfileUpdateMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: employee.id,
        data: { allowedMcpServerIds: ["singlepagestartup"] },
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Edit MCP Servers" }),
      ).toBeNull(),
    );
  });

  it("saves the employee profile using the operator profile and keeps the draft when saving fails", async () => {
    const employee = {
      id: "employee-profile",
      slug: "alice",
      variant: "artificial-intelligence",
      adminTitle: "Alice",
      title: { en: "Alice", ru: "Алиса" },
    };
    mockProfileUpdateMutateAsync
      .mockRejectedValueOnce(new Error("Profile unavailable"))
      .mockResolvedValueOnce({
        ...employee,
        title: { en: "Alice Green", ru: "Алиса" },
      });
    renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: employee,
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Alice profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit profile alice" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Profile" });
    expect(within(dialog).queryByLabelText("Admin title")).toBeNull();
    expect(within(dialog).queryByLabelText("Slug")).toBeNull();
    expect(within(dialog).getByLabelText("Headline")).toBeTruthy();
    expect(within(dialog).getByLabelText("Description")).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Alice Green" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save profile" }),
    );
    await waitFor(() =>
      expect(mockProfileUpdateMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: employee.id,
        data: { title: { en: "Alice Green" } },
      }),
    );
    expect(
      (within(dialog).getByLabelText("Name") as HTMLInputElement).value,
    ).toBe("Alice Green");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save profile" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit Profile" })).toBeNull(),
    );
  });
  it("immediately uploads or resets the employee avatar without submitting the profile draft", async () => {
    const employee = {
      id: "employee-profile",
      slug: "alice",
      variant: "artificial-intelligence",
      title: { en: "Alice", ru: "Алиса" },
    };
    mockProfileAvatarUpdateMutateAsync.mockResolvedValue({ file: null });
    renderComponent("store-employee", {
      artificialIntelligenceOpponentProfile: employee,
      language: "ru",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Открыть профиль «Алиса»" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit profile alice" }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Редактирование профиля" }),
    );
    expect(dialog.getByLabelText("Имя")).toHaveProperty("value", "Алиса");
    fireEvent.change(dialog.getByLabelText("Имя"), {
      target: { value: "Draft" },
    });
    expect(dialog.getByRole("button", { name: "Закрыть" })).toBeTruthy();
    const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(dialog.getByLabelText("Выбрать аватар профиля"), {
      target: { files: [avatar] },
    });
    const scope = {
      id: "subject-1",
      socialModuleProfileId: "profile-1",
      socialModuleChatId: "chat-1",
      targetSocialModuleProfileId: employee.id,
    };
    await waitFor(() =>
      expect(mockProfileAvatarUpdateMutateAsync).toHaveBeenCalledWith({
        ...scope,
        data: { file: avatar },
      }),
    );
    fireEvent.click(dialog.getByRole("button", { name: "Удалить" }));
    await waitFor(() =>
      expect(mockProfileAvatarUpdateMutateAsync).toHaveBeenCalledWith({
        ...scope,
        data: { reset: true },
      }),
    );
    expect(mockProfileUpdateMutateAsync).not.toHaveBeenCalled();
    expect(dialog.getByLabelText("Имя")).toHaveProperty("value", "Draft");
  });
});
