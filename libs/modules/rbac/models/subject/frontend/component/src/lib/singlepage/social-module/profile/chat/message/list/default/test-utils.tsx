import { render } from "@testing-library/react";
import { Component } from "./ClientComponent";

export const mockMessageCreateMutate = jest.fn();
export const mockMessageDeleteMutate = jest.fn();
export const mockMessageUpdateMutate = jest.fn();
export const mockMessageReactByKnowledgeMutate = jest.fn();
export const mockMessageReactByOpenrouterMutate = jest.fn();
export const mockOpenRouterModelFavoriteUpdateMutate = jest.fn();
export const mockProfileUpdateMutate = jest.fn();
export const mockKnowledgeDocumentUpdateMutate = jest.fn();
export const mockKnowledgeDocumentCreateMutate = jest.fn();
export const mockKnowledgeReindexDocumentMutateAsync = jest.fn();
export const mockKnowledgeDocumentDeleteMutateAsync = jest.fn();
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
  socialModuleActions: [] as any[],
  socialModuleMessages: [] as any[],
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
            {props.onProfileEdit ? (
              <button
                type="button"
                aria-label={`Edit profile ${props.data.slug}`}
                onClick={() => {
                  props.onProfileEdit?.(props.data);
                }}
              >
                Edit profile
              </button>
            ) : null}
            <section>
              <h3>Skills</h3>
              {props.onSkillCreate ? (
                <button
                  type="button"
                  onClick={() => {
                    props.onSkillCreate?.(props.data);
                  }}
                >
                  New skill for {props.data.slug}
                </button>
              ) : null}
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
            {props.mode !== "create" && props.onDelete ? (
              <>
                <button type="button" aria-label="Delete knowledge">
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void props.onDelete?.(props.data);
                  }}
                >
                  Delete Knowledge
                </button>
              </>
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
  function getTargetProfileSkills(request: any) {
    const targetProfileId = request?.targetSocialModuleProfileId;

    if (!targetProfileId) {
      return mockChatComponentState.socialSkills;
    }

    const relationSkillIds = mockChatComponentState.profileSkillRelations
      .filter((relation) => {
        return relation.profileId === targetProfileId;
      })
      .map((relation) => {
        return relation.skillId;
      });

    if (relationSkillIds.length === 0) {
      return mockChatComponentState.socialSkills;
    }

    return mockChatComponentState.socialSkills.filter((skill) => {
      return relationSkillIds.includes(skill.id);
    });
  }

  return {
    api: {
      socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind: jest.fn(
        () => {
          return {
            data: mockChatComponentState.socialModuleMessages,
            isLoading: false,
          };
        },
      ),
      socialModuleProfileFindByIdChatFindByIdActionFind: jest.fn(() => {
        return {
          data: mockChatComponentState.socialModuleActions,
          isLoading: false,
        };
      }),
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
                      supportsReasoning: true,
                    },
                    {
                      id: "openai/gpt-basic",
                      name: "GPT Basic",
                      description: "Text model without reasoning",
                      contextLength: 32000,
                      inputModalities: ["text"],
                      outputModalities: ["text"],
                      supportedParameters: [],
                      supportsReasoning: false,
                    },
                  ],
                },
              ],
            },
            isLoading: false,
          };
        },
      ),
      socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFind:
        jest.fn(() => {
          return {
            data: {
              favoriteModelIds: [],
            },
            isLoading: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate:
        jest.fn(() => {
          return {
            mutate: mockOpenRouterModelFavoriteUpdateMutate,
            isPending: false,
            isSuccess: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate: jest.fn(
        () => {
          return {
            mutate: mockProfileUpdateMutate,
            isPending: false,
          };
        },
      ),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind: jest.fn(
        (request) => {
          return {
            data: getTargetProfileSkills(request),
            isLoading: false,
            refetch: jest.fn(),
          };
        },
      ),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate:
        jest.fn(() => {
          return {
            mutateAsync: mockSocialSkillCreateMutateAsync,
            isPending: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate:
        jest.fn(() => {
          return {
            mutateAsync: mockSocialSkillUpdateMutateAsync,
            isPending: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind:
        jest.fn(() => {
          return {
            data: mockChatComponentState.knowledgeDocuments,
            isLoading: false,
            refetch: mockKnowledgeDocumentFindRefetch,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate:
        jest.fn(() => {
          return {
            mutate: mockKnowledgeDocumentCreateMutate,
            isPending: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate:
        jest.fn(() => {
          return {
            mutate: mockKnowledgeDocumentUpdateMutate,
            isPending: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex:
        jest.fn(() => {
          return {
            mutateAsync: mockKnowledgeReindexDocumentMutateAsync,
            isPending: false,
          };
        }),
      socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete:
        jest.fn(() => {
          return {
            mutateAsync: mockKnowledgeDocumentDeleteMutateAsync,
            isPending: false,
          };
        }),
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
      socialModuleProfileFindByIdKnowledgeDocumentFindByIdDelete: jest.fn(
        () => {
          return {
            mutateAsync: mockKnowledgeDocumentDeleteMutateAsync,
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
  const { QueryClient } = jest.requireActual("@tanstack/react-query");

  // A REAL QueryClient (issue #195): the cache helpers (appendToListQueries /
  // patchInListQueries / removeFromListQueries) must run their updater bodies
  // against real cached arrays so the cache specs can assert the resulting
  // array — not merely that setQueryData/getQueryCache were invoked. The
  // methods are spied (not replaced) so the existing call/no-call assertions
  // keep working while the real cache mutation still happens.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    },
  });
  jest.spyOn(queryClient, "invalidateQueries");
  jest.spyOn(queryClient, "setQueryData");
  jest.spyOn(queryClient, "getQueryCache");

  return {
    ...actual,
    queryClient,
  };
});

export const mockSharedApiQueryClient = jest.requireMock(
  "@sps/shared-frontend-client-api",
).queryClient as import("@tanstack/react-query").QueryClient & {
  invalidateQueries: jest.Mock;
  setQueryData: jest.Mock;
  getQueryCache: jest.Mock;
};

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
  // Timeline data now flows through the mocked SDK find queries consumed by
  // MessageTimelineSection (issue #195) — translate the legacy option shape
  // into mock query state instead of passing message arrays as props.
  const timelineItems = options.socialModuleMessagesAndActionsQuery || [];
  mockChatComponentState.socialModuleMessages = timelineItems
    .filter((item) => item.type === "message")
    .map((item) => item.data);
  mockChatComponentState.socialModuleActions = timelineItems
    .filter((item) => item.type === "action")
    .map((item) => item.data);

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
    />,
  );
}

export function resetChatComponentMocks() {
  jest.clearAllMocks();
  // Reset the real shared QueryClient cache between tests so seeded list
  // queries do not leak across cache specs (issue #195).
  mockSharedApiQueryClient.clear();
  mockMessageCreateMutate.mockReset();
  mockMessageDeleteMutate.mockReset();
  mockMessageUpdateMutate.mockReset();
  mockMessageReactByKnowledgeMutate.mockReset();
  mockMessageReactByOpenrouterMutate.mockReset();
  mockOpenRouterModelFavoriteUpdateMutate.mockReset();
  mockProfileUpdateMutate.mockReset();
  mockKnowledgeDocumentUpdateMutate.mockReset();
  mockKnowledgeDocumentCreateMutate.mockReset();
  mockKnowledgeReindexDocumentMutateAsync.mockReset();
  mockKnowledgeDocumentDeleteMutateAsync.mockReset();
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
  mockChatComponentState.socialModuleActions = [];
  mockChatComponentState.socialModuleMessages = [];
  mockChatComponentState.socialSkills = [];
  mockKnowledgeReindexDocumentMutateAsync.mockResolvedValue({
    data: {
      indexed: 1,
      skipped: 0,
      dryRun: false,
      sources: [],
    },
  });
  mockKnowledgeDocumentDeleteMutateAsync.mockResolvedValue({
    id: "document-1",
  });
  mockProfileUpdateMutate.mockImplementation((payload, options) => {
    options?.onSuccess?.({
      id: payload.targetSocialModuleProfileId,
      slug: "chat-gpt-1",
      variant: "artificial-intelligence",
      adminTitle: payload.data.adminTitle || "Chat GPT 1",
      title: payload.data.title || {},
      subtitle: payload.data.subtitle || {},
      description: payload.data.description || {},
    });
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
