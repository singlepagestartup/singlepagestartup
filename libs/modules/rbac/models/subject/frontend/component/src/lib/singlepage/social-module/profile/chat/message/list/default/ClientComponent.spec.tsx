/**
 * @jest-environment jsdom
 *
 * BDD Suite: Knowledge chat command picker.
 *
 * Given: the default social chat composer is reused for Knowledge chats.
 * When: a user interacts with Knowledge chat commands and documents.
 * Then: the /learn command picker and Knowledge document sidebar are scoped to Knowledge chats.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component } from "./ClientComponent";

const mockMessageCreateMutate = jest.fn();
const mockMessageDeleteMutate = jest.fn();
const mockMessageUpdateMutate = jest.fn();
const mockMessageReactByKnowledgeMutate = jest.fn();
const mockKnowledgeDocumentUpdateMutate = jest.fn();
const mockKnowledgeReindexDocumentMutateAsync = jest.fn();
const mockKnowledgeDocumentFindRefetch = jest.fn();

let mockKnowledgeDocuments: any[] = [];

jest.mock(
  "@sps/social/relations/profiles-to-messages/frontend/component",
  () => {
    return {
      Component: ({ children }: { children?: (props: any) => any }) => {
        return typeof children === "function" ? children({ data: [] }) : null;
      },
    };
  },
);

jest.mock(
  "@sps/social/relations/profiles-to-actions/frontend/component",
  () => {
    return {
      Component: ({ children }: { children?: (props: any) => any }) => {
        return typeof children === "function" ? children({ data: [] }) : null;
      },
    };
  },
);

jest.mock("@sps/social/models/profile/frontend/component", () => {
  return {
    Component: ({ children }: { children?: (props: any) => any }) => {
      return typeof children === "function" ? children({ data: [] }) : null;
    },
  };
});

jest.mock("@sps/rbac/models/subject/sdk/client", () => {
  return {
    api: {
      socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate:
        jest.fn(() => {
          return {
            mutate: mockMessageCreateMutate,
            isPending: false,
            isSuccess: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdMessageDelete: jest.fn(() => {
        return {
          mutate: mockMessageDeleteMutate,
          isPending: false,
          isSuccess: false,
        };
      }),
      socialModuleProfileFindByIdChatFindByIdMessageUpdate: jest.fn(() => {
        return {
          mutate: mockMessageUpdateMutate,
          isPending: false,
          isSuccess: false,
        };
      }),
      socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByKnowledge:
        jest.fn(() => {
          return {
            mutate: mockMessageReactByKnowledgeMutate,
            isPending: false,
            isSuccess: false,
          };
        }),
      socialModuleProfileFindByIdKnowledgeDocumentFind: jest.fn(() => {
        return {
          data: mockKnowledgeDocuments,
          isLoading: false,
          refetch: mockKnowledgeDocumentFindRefetch,
        };
      }),
      socialModuleProfileFindByIdKnowledgeDocumentFindByIdUpdate: jest.fn(
        () => {
          return {
            mutate: mockKnowledgeDocumentUpdateMutate,
            isPending: false,
          };
        },
      ),
      socialModuleProfileFindByIdKnowledgeDocumentFindByIdReindex: jest.fn(
        () => {
          return {
            mutateAsync: mockKnowledgeReindexDocumentMutateAsync,
            isPending: false,
          };
        },
      ),
    },
    queryClient: {
      invalidateQueries: jest.fn(),
    },
  };
});

jest.mock("@sps/shared-frontend-client-api", () => {
  const actual = jest.requireActual("@sps/shared-frontend-client-api");

  return {
    ...actual,
    queryClient: {
      invalidateQueries: jest.fn(),
    },
  };
});

jest.mock("@uiw/react-md-editor", () => {
  return function MDEditorMock() {
    return <textarea aria-label="markdown editor" />;
  };
});

function renderComponent(chatVariant: "default" | "knowledge") {
  return render(
    <Component
      isServer={false}
      variant="social-module-profile-chat-message-list-default"
      language="en"
      data={{ id: "subject-1" } as any}
      socialModuleProfile={
        {
          id: "profile-1",
          slug: "user",
          variant: "default",
        } as any
      }
      knowledgeAssistantProfile={
        chatVariant === "knowledge"
          ? ({
              id: "assistant-profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              adminTitle: "Chat GPT 1",
            } as any)
          : null
      }
      socialModuleChat={
        {
          id: "chat-1",
          variant: chatVariant,
        } as any
      }
      socialModuleThreadId="thread-1"
      socialModuleMessagesAndActionsQuery={[]}
    />,
  );
}

describe("Given: Knowledge chat command picker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessageCreateMutate.mockReset();
    mockMessageDeleteMutate.mockReset();
    mockMessageUpdateMutate.mockReset();
    mockMessageReactByKnowledgeMutate.mockReset();
    mockKnowledgeDocumentUpdateMutate.mockReset();
    mockKnowledgeReindexDocumentMutateAsync.mockReset();
    mockKnowledgeDocumentFindRefetch.mockReset();
    mockKnowledgeDocuments = [];
    mockKnowledgeReindexDocumentMutateAsync.mockResolvedValue({
      data: {
        indexed: 1,
        skipped: 0,
        dryRun: false,
        sources: [],
      },
    });

    window.HTMLElement.prototype.scrollTo = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    };
    (globalThis as any).ResizeObserver = class ResizeObserverMock {
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
    };
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant knowledge.
   * When: the user types a slash prefix in the composer.
   * Then: the /learn command appears and selecting it inserts "/learn ".
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

    fireEvent.click(screen.getByText("Learn"));

    expect((textarea as HTMLTextAreaElement).value).toBe("/learn ");
    expect(document.activeElement).toBe(textarea);
  });

  /**
   * BDD Scenario
   * Given: the active chat has variant default.
   * When: the user types a slash prefix in the composer.
   * Then: Knowledge commands are not shown.
   */
  it("When: typing slash in a default chat Then: Knowledge commands are hidden", () => {
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
   * Given: the active chat uses the existing composer.
   * When: the user attaches a file and submits a message.
   * Then: the current submit and attachment payload shape is preserved.
   */
  it("When: submitting with an attachment Then: the existing message flow is preserved", async () => {
    const { container } = renderComponent("knowledge");
    const textarea = screen.getByPlaceholderText("Write a message...");
    const submitButton = screen.getByLabelText("Send message");
    const fileInput = container.querySelector('input[type="file"]');
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
          },
        },
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message starts with /learn.
   * When: the message is created from the composer.
   * Then: the Knowledge reaction endpoint is called for the AI assistant profile so indexing runs.
   */
  it("When: creating a /learn message Then: it triggers Knowledge learning for the AI profile", async () => {
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-1",
        description: "/learn Stored context",
      });
    });

    renderComponent("knowledge");

    const textarea = screen.getByPlaceholderText("Write a message...");
    fireEvent.change(textarea, {
      target: {
        value: "/learn Stored context",
      },
    });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockMessageReactByKnowledgeMutate).toHaveBeenCalledWith(
        {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          socialModuleMessageId: "message-1",
          data: {
            shouldReplySocialModuleProfile: {
              id: "assistant-profile-1",
            },
          },
        },
        expect.any(Object),
      );
    });
  });

  /**
   * BDD Scenario
   * Given: a default chat message starts with /learn.
   * When: the message is created from the composer.
   * Then: Knowledge reaction is not called because learning is scoped to Knowledge chats.
   */
  it("When: creating /learn in a default chat Then: it does not trigger Knowledge learning", async () => {
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
      expect(mockMessageCreateMutate).toHaveBeenCalled();
    });
    expect(mockMessageReactByKnowledgeMutate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat has documents linked to the AI profile.
   * When: the message list renders.
   * Then: the Knowledge documents sidebar is visible.
   */
  it("When: rendering a Knowledge chat Then: linked documents are shown", async () => {
    mockKnowledgeDocuments = [
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

    renderComponent("knowledge");

    expect(await screen.findByText("Chat GPT 1")).toBeTruthy();
    expect(screen.getAllByText("Policy").length).toBeGreaterThan(0);
  });

  /**
   * BDD Scenario
   * Given: a default chat is rendered.
   * When: the message list loads.
   * Then: the Knowledge document sidebar is hidden.
   */
  it("When: rendering a default chat Then: Knowledge documents are hidden", () => {
    renderComponent("default");

    expect(screen.queryByText("Knowledge")).toBeNull();
    expect(screen.queryByText("Documents")).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge document is selected in chat.
   * When: the user saves edited content.
   * Then: the document is updated without triggering reindex.
   */
  it("When: saving a document Then: it updates without reindexing", async () => {
    mockKnowledgeDocuments = [
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
        ...mockKnowledgeDocuments[0],
        title: payload.data.title,
        description: payload.data.description,
      });
    });

    renderComponent("knowledge");

    const titleInput = await screen.findByDisplayValue("Policy");
    fireEvent.change(titleInput, {
      target: {
        value: "Policy updated",
      },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockKnowledgeDocumentUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          knowledgeModuleDocumentId: "document-1",
          params: {
            targetSocialModuleProfileId: "assistant-profile-1",
            socialModuleChatId: "chat-1",
          },
          data: expect.objectContaining({
            title: "Policy updated",
          }),
        }),
        expect.any(Object),
      );
    });
    expect(mockKnowledgeReindexDocumentMutateAsync).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge document is selected in chat.
   * When: the user clicks Reindex.
   * Then: the document reindex action runs for that document.
   */
  it("When: reindexing a document Then: it calls the RBAC scoped reindex action", async () => {
    mockKnowledgeDocuments = [
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

    renderComponent("knowledge");

    await screen.findByDisplayValue("Policy");
    fireEvent.click(screen.getByText("Reindex"));

    await waitFor(() => {
      expect(mockKnowledgeReindexDocumentMutateAsync).toHaveBeenCalledWith({
        id: "subject-1",
        socialModuleProfileId: "profile-1",
        knowledgeModuleDocumentId: "document-1",
        params: {
          targetSocialModuleProfileId: "assistant-profile-1",
          socialModuleChatId: "chat-1",
        },
      });
    });
  });
});
