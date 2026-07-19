/**
 * @jest-environment jsdom
 *
 * BDD Suite: OpenRouter chat profile sidebar.
 *
 * Given: the default social chat composer supports AI/OpenRouter chats.
 * When: a user interacts with Knowledge chat commands, skills, and message profile names.
 * Then: /learn, @knowledge, profile skills, and profile knowledge work when an AI profile is present.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  mockChatComponentState,
  mockKnowledgeDocumentCreateMutate,
  mockKnowledgeDocumentDeleteMutateAsync,
  mockKnowledgeDocumentUpdateMutate,
  mockKnowledgeReindexDocumentMutateAsync,
  mockMessageCreateMutate,
  mockOpenRouterModelFavoriteUpdateMutate,
  mockProfileSkillFind,
  mockThreadUpdateMutate,
  mockSocialSkillCreateMutateAsync,
  mockSocialSkillUpdateMutateAsync,
  renderComponent,
  resetChatComponentMocks,
} from "./test-utils";

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

    const textarea = screen.getByPlaceholderText("Write a message...");

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

    const textarea = screen.getByPlaceholderText("Write a message...");

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

    const textarea = screen.getByPlaceholderText("Write a message...");

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

    fireEvent.change(screen.getByPlaceholderText("Write a message..."), {
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

    const textarea = screen.getByPlaceholderText("Write a message...");

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
   * Then: the message input reserves three rows and hides Thinking until a compatible model is selected.
   */
  it("When: rendering an AI-opponent chat Then: the composer uses the expanded layout", () => {
    renderComponent("knowledge");

    const textarea = screen.getByPlaceholderText("Write a message...");

    expect(textarea.getAttribute("rows")).toBe("3");
    expect(screen.getByLabelText("Select OpenRouter model")).toBeTruthy();
    expect(screen.queryByLabelText("Select OpenRouter thinking")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: the active chat does not have an artificial-intelligence opponent.
   * When: the composer is rendered.
   * Then: the compact one-row composer is preserved.
   */
  it("When: rendering a non-AI-opponent chat Then: the compact composer remains", () => {
    renderComponent("knowledge", {
      knowledgeAssistantProfile: {
        id: "assistant-profile-1",
        slug: "human-profile",
        variant: "default",
        adminTitle: "Human Profile",
      },
    });

    const textarea = screen.getByPlaceholderText("Write a message...");

    expect(textarea.getAttribute("rows")).toBe("1");
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
    const textarea = screen.getByPlaceholderText("Write a message...");
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

  /**
   * BDD Scenario
   * Given: two different files have the same name and are selected in separate picker operations.
   * When: the user adds the second file after the first one.
   * Then: the composer retains and submits both files as separate attachments.
   */
  it("When: adding same-named files separately Then: both attachments are retained", async () => {
    const { container } = renderComponent("knowledge");
    const textarea = screen.getByPlaceholderText("Write a message...");
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
   * Then: the composer previews the local file and omits the removed file from the payload.
   */
  it("When: managing a selected attachment Then: it can be opened and removed before submit", async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalOpen = window.open;
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
      const textarea = screen.getByPlaceholderText("Write a message...");
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

      fireEvent.click(screen.getByLabelText("Open attached file notes.md"));

      expect(createObjectURL).toHaveBeenCalledWith(file);
      expect(open).toHaveBeenCalledWith(
        "blob:notes-preview",
        "_blank",
        "noopener,noreferrer",
      );
      jest.runOnlyPendingTimers();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:notes-preview");
      jest.useRealTimers();

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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter model"), {
      button: 0,
      ctrlKey: false,
    });
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter model"), {
      button: 0,
      ctrlKey: false,
    });
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

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter model"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("GPT-5.2"));

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter thinking"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("High"));

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter model"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByText("GPT Basic"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Select OpenRouter thinking")).toBeNull();
    });

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    fireEvent.pointerDown(screen.getByLabelText("Select OpenRouter model"), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.change(
      await screen.findByPlaceholderText("Search model or slug..."),
      {
        target: {
          value: "openai/gpt-5.2",
        },
      },
    );

    expect(await screen.findByText("GPT-5.2")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Add model to favorites"));

    await waitFor(() => {
      expect(mockOpenRouterModelFavoriteUpdateMutate).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        data: {
          favoriteModelIds: ["openai/gpt-5.2"],
        },
      });
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    fireEvent.change(screen.getByPlaceholderText("Write a message..."), {
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    fireEvent.change(screen.getByPlaceholderText("Write a message..."), {
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

    fireEvent.change(screen.getByPlaceholderText("Write a message..."), {
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

    fireEvent.change(screen.getByPlaceholderText("Write a message..."), {
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
    mockChatComponentState.knowledgeDocuments = [
      {
        id: "document-1",
        title: "Policy",
        description: "Policy details",
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

    expect(screen.getByText("Chat GPT 1")).toBeTruthy();
    expect(screen.getByText("YouTube Description")).toBeTruthy();
    expect(screen.getAllByText("Policy").length).toBeGreaterThan(0);
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
   * When: the user creates a Knowledge document from that sidebar.
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
    fireEvent.click(screen.getByRole("button", { name: "Create knowledge" }));

    await waitFor(() => {
      expect(mockKnowledgeDocumentCreateMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          data: {
            title: "Sidebar Knowledge",
            description: "Created from the sidebar profile.",
            orderIndex: 0,
            metadata: {
              socialModuleChatId: "chat-1",
            },
          },
        },
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar shows a linked Knowledge document.
   * When: the user confirms deleting the document.
   * Then: the RBAC scoped delete endpoint receives the selected profile scope and the dialog closes.
   */
  it("When: deleting a profile Knowledge document Then: it hard-deletes in that profile scope", async () => {
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
    mockChatComponentState.knowledgeDocuments = [
      {
        id: "document-1",
        title: "Temporary Knowledge",
        description: "Temporary details",
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
      expect(mockKnowledgeDocumentDeleteMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: "assistant-profile-1",
        knowledgeModuleDocumentId: "document-1",
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Edit Knowledge")).toBeNull();
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat profile sidebar shows linked Knowledge documents.
   * When: the user selects a document, edits it, saves it, and reindexes it.
   * Then: the RBAC scoped Knowledge update and reindex endpoints receive the selected profile scope.
   */
  it("When: editing a profile Knowledge document Then: it saves and reindexes in that profile scope", async () => {
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
    mockChatComponentState.knowledgeDocuments = [
      {
        id: "document-1",
        title: "Policy",
        description: "Policy details",
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
    mockKnowledgeDocumentUpdateMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({
        ...mockChatComponentState.knowledgeDocuments[0],
        title: payload.data.title,
        description: payload.data.description,
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
      expect(mockKnowledgeDocumentUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          targetSocialModuleProfileId: "assistant-profile-1",
          knowledgeModuleDocumentId: "document-1",
          data: expect.objectContaining({
            title: "Policy updated",
          }),
        }),
        expect.any(Object),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Reindex knowledge" }));

    await waitFor(() => {
      expect(mockKnowledgeReindexDocumentMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        socialModuleChatId: "chat-1",
        targetSocialModuleProfileId: "assistant-profile-1",
        knowledgeModuleDocumentId: "document-1",
      });
    });
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
});
