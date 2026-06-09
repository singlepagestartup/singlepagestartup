import { render } from "@testing-library/react";
import { Component } from "./ClientComponent";

export const mockMessageCreateMutate = jest.fn();
export const mockMessageDeleteMutate = jest.fn();
export const mockMessageUpdateMutate = jest.fn();
export const mockMessageReactByKnowledgeMutate = jest.fn();
export const mockMessageReactByOpenrouterMutate = jest.fn();
export const mockKnowledgeDocumentUpdateMutate = jest.fn();
export const mockKnowledgeDocumentCreateMutate = jest.fn();
export const mockKnowledgeReindexDocumentMutateAsync = jest.fn();
export const mockKnowledgeDocumentFindRefetch = jest.fn();
export const mockSocialSkillCreateMutateAsync = jest.fn();
export const mockSocialSkillUpdateMutateAsync = jest.fn();
export const mockProfilesToSkillsCreateMutateAsync = jest.fn();
export const mockToastError = jest.fn();
export const mockToastSuccess = jest.fn();

export const mockChatComponentState = {
  knowledgeDocuments: [] as any[],
  profileMessageRelations: [] as any[],
  profiles: [] as any[],
  profileSkillRelations: [] as any[],
  socialSkills: [] as any[],
};

jest.mock(
  "@sps/social/relations/profiles-to-messages/frontend/component",
  () => {
    return {
      Component: ({ children }: { children?: (props: any) => any }) => {
        return typeof children === "function"
          ? children({ data: mockChatComponentState.profileMessageRelations })
          : null;
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

jest.mock("sonner", () => {
  return {
    toast: {
      error: (...args: unknown[]) => mockToastError(...args),
      success: (...args: unknown[]) => mockToastSuccess(...args),
    },
  };
});

jest.mock("@sps/social/models/profile/frontend/component", () => {
  return {
    Component: (props: any) => {
      if (props.variant === "find") {
        const idFilter = props.apiProps?.params?.filters?.and?.find(
          (filter: any) => filter.column === "id",
        );
        const profiles = idFilter
          ? mockChatComponentState.profiles.filter((profile) => {
              return profile.id === idFilter.value;
            })
          : mockChatComponentState.profiles;

        return typeof props.children === "function"
          ? props.children({ data: profiles })
          : null;
      }

      if (props.variant === "chat-message-row") {
        return (
          <article>
            <button
              type="button"
              onClick={() => {
                props.onProfileOpen?.(props.data);
              }}
            >
              {props.data.slug}
            </button>
            <p>{props.message.description}</p>
          </article>
        );
      }

      if (props.variant === "chat-profile-sidebar") {
        return (
          <aside>
            <h2>{props.data.adminTitle || props.data.slug}</h2>
            <section>
              <h3>Skills</h3>
              <button
                type="button"
                onClick={() => {
                  props.onSkillCreate?.(props.data);
                }}
              >
                New skill for {props.data.slug}
              </button>
              {props.skills?.map((skill: any) => {
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => {
                      props.onSkillEdit?.(skill);
                    }}
                  >
                    {skill.title || skill.slug}
                  </button>
                );
              })}
            </section>
            <section>
              <h3>Knowledge</h3>
              {props.onKnowledgeDocumentCreate ? (
                <button
                  type="button"
                  onClick={() => {
                    props.onKnowledgeDocumentCreate?.(props.data);
                  }}
                >
                  New knowledge for {props.data.slug}
                </button>
              ) : null}
              {props.knowledgeDocuments?.map((document: any) => {
                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => {
                      props.onKnowledgeDocumentSelect?.(document);
                    }}
                  >
                    {document.title}
                  </button>
                );
              })}
            </section>
          </aside>
        );
      }

      return typeof props.children === "function"
        ? props.children({ data: [] })
        : null;
    },
  };
});

jest.mock(
  "@sps/knowledge/models/document/frontend/component/src/lib/singlepage/chat-sidebar-detail",
  () => {
    return {
      Component: (props: any) => {
        return (
          <div data-testid="knowledge-document-dialog-form">
            <input
              aria-label="Knowledge title"
              value={props.draft?.title || ""}
              onChange={(event) => {
                props.onDraftChange?.({
                  ...props.draft,
                  title: event.target.value,
                });
              }}
            />
            <textarea
              aria-label="Knowledge content"
              value={props.draft?.description || ""}
              onChange={(event) => {
                props.onDraftChange?.({
                  ...props.draft,
                  description: event.target.value,
                });
              }}
            />
            <button
              type="button"
              onClick={() => {
                props.onSave?.(props.data);
              }}
            >
              {props.mode === "create" ? "Create knowledge" : "Save knowledge"}
            </button>
            {props.mode !== "create" ? (
              <button
                type="button"
                onClick={() => {
                  void props.onReindex?.(props.data);
                }}
              >
                Reindex knowledge
              </button>
            ) : null}
          </div>
        );
      },
    };
  },
);

jest.mock("@sps/social/models/skill/sdk/client", () => {
  return {
    api: {
      create: jest.fn(() => {
        return {
          mutateAsync: mockSocialSkillCreateMutateAsync,
          isPending: false,
        };
      }),
      update: jest.fn(() => {
        return {
          mutateAsync: mockSocialSkillUpdateMutateAsync,
          isPending: false,
        };
      }),
      find: jest.fn((request) => {
        const idFilter = request?.params?.filters?.and?.find((filter: any) => {
          return filter.column === "id";
        });
        const ids = Array.isArray(idFilter?.value) ? idFilter.value : null;

        return {
          data: ids
            ? mockChatComponentState.socialSkills.filter((skill) => {
                return ids.includes(skill.id);
              })
            : mockChatComponentState.socialSkills,
          isLoading: false,
        };
      }),
    },
    queryClient: {
      invalidateQueries: jest.fn(),
    },
  };
});

jest.mock("@sps/social/relations/profiles-to-skills/sdk/client", () => {
  return {
    api: {
      create: jest.fn(() => {
        return {
          mutateAsync: mockProfilesToSkillsCreateMutateAsync,
          isPending: false,
        };
      }),
      find: jest.fn((request) => {
        const profileFilter = request?.params?.filters?.and?.find(
          (filter: any) => {
            return filter.column === "profileId";
          },
        );
        const profileId = profileFilter?.value;

        return {
          data: profileId
            ? mockChatComponentState.profileSkillRelations.filter(
                (relation) => {
                  return relation.profileId === profileId;
                },
              )
            : mockChatComponentState.profileSkillRelations,
          isLoading: false,
        };
      }),
    },
    queryClient: {
      invalidateQueries: jest.fn(),
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
      socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter:
        jest.fn(() => {
          return {
            mutate: mockMessageReactByOpenrouterMutate,
            isPending: false,
            isSuccess: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind: jest.fn(
        () => {
          return {
            data: {
              auto: {
                id: "auto",
                name: "Auto",
                description: "Automatically select the best model.",
              },
              groups: [
                {
                  id: "text",
                  title: "Text",
                  models: [
                    {
                      id: "openai/gpt-5.2",
                      name: "GPT-5.2",
                      description: "Text model",
                      contextLength: 128000,
                      inputModalities: ["text"],
                      outputModalities: ["text"],
                      supportedParameters: ["reasoning"],
                    },
                  ],
                },
              ],
            },
            isLoading: false,
          };
        },
      ),
      socialModuleProfileFindByIdKnowledgeDocumentFind: jest.fn(() => {
        return {
          data: mockChatComponentState.knowledgeDocuments,
          isLoading: false,
          refetch: mockKnowledgeDocumentFindRefetch,
        };
      }),
      socialModuleProfileFindByIdKnowledgeDocumentCreate: jest.fn(() => {
        return {
          mutate: mockKnowledgeDocumentCreateMutate,
          isPending: false,
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

interface RenderComponentOptions {
  artificialIntelligenceOpponentProfile?: any | null;
  knowledgeAssistantProfile?: any | null;
  socialModuleMessagesAndActionsQuery?: any[];
}

export function renderComponent(
  chatVariant: "default" | "knowledge",
  options: RenderComponentOptions = {},
) {
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
      artificialIntelligenceOpponentProfile={
        options.artificialIntelligenceOpponentProfile
      }
      knowledgeAssistantProfile={
        Object.prototype.hasOwnProperty.call(
          options,
          "knowledgeAssistantProfile",
        )
          ? options.knowledgeAssistantProfile
          : chatVariant === "knowledge"
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
      socialModuleMessagesAndActionsQuery={
        options.socialModuleMessagesAndActionsQuery || []
      }
    />,
  );
}

export function resetChatComponentMocks() {
  jest.clearAllMocks();
  mockMessageCreateMutate.mockReset();
  mockMessageDeleteMutate.mockReset();
  mockMessageUpdateMutate.mockReset();
  mockMessageReactByKnowledgeMutate.mockReset();
  mockMessageReactByOpenrouterMutate.mockReset();
  mockKnowledgeDocumentUpdateMutate.mockReset();
  mockKnowledgeDocumentCreateMutate.mockReset();
  mockKnowledgeReindexDocumentMutateAsync.mockReset();
  mockKnowledgeDocumentFindRefetch.mockReset();
  mockSocialSkillCreateMutateAsync.mockReset();
  mockSocialSkillUpdateMutateAsync.mockReset();
  mockProfilesToSkillsCreateMutateAsync.mockReset();
  mockToastError.mockReset();
  mockToastSuccess.mockReset();
  mockChatComponentState.knowledgeDocuments = [];
  mockChatComponentState.profileMessageRelations = [];
  mockChatComponentState.profiles = [];
  mockChatComponentState.profileSkillRelations = [];
  mockChatComponentState.socialSkills = [];
  mockKnowledgeReindexDocumentMutateAsync.mockResolvedValue({
    data: {
      indexed: 1,
      skipped: 0,
      dryRun: false,
      sources: [],
    },
  });
  mockKnowledgeDocumentCreateMutate.mockImplementation((payload, options) => {
    options?.onSuccess?.({
      id: "document-created-1",
      title: payload.data.title,
      description: payload.data.description,
      slug: "created-knowledge",
      adminTitle: payload.data.title,
      variant: "default",
      className: null,
      status: "imported",
      summary: null,
      tags: [],
      metadata: {},
      contentHash: "created-hash",
      lastIndexedAt: new Date("2026-01-01T10:00:00.000Z"),
    });
  });
  mockSocialSkillCreateMutateAsync.mockResolvedValue({
    id: "skill-created-1",
    title: "Created Skill",
    slug: "created-skill",
    description: "Created skill instructions",
    status: "active",
  });
  mockProfilesToSkillsCreateMutateAsync.mockResolvedValue({
    id: "profile-skill-created-1",
  });
  mockSocialSkillUpdateMutateAsync.mockResolvedValue({
    id: "skill-updated-1",
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
}
