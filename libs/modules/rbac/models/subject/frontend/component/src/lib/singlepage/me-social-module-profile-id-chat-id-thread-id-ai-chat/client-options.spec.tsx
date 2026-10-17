import type { IComponentProps } from "./interface";
jest.mock("client-only", () => ({}), { virtual: true });
const mockReads = {
  socialModuleProfileFind: jest
    .fn()
    .mockResolvedValue([
      { id: "assistant", variant: "artificial-intelligence" },
    ]),
  identityFind: jest.fn().mockResolvedValue([]),
  billingModuleBalance: jest.fn().mockResolvedValue({ amount: "3000" }),
  socialModuleProfileFindByIdAvatarFind: jest
    .fn()
    .mockResolvedValue({ file: null }),
  socialModuleChatFindByIdThreadFind: jest
    .fn()
    .mockResolvedValue([{ id: "thread" }]),
  socialModuleProfileProjects: jest
    .fn()
    .mockResolvedValue([{ profile: { id: "assistant" } }]),
  socialModuleProfileFindByIdChatFindByIdProfileFind: jest
    .fn()
    .mockResolvedValue([
      { id: "assistant", variant: "artificial-intelligence" },
    ]),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind: jest
    .fn()
    .mockResolvedValue([]),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind:
    jest.fn().mockResolvedValue([{ id: "source" }]),
  socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind:
    jest.fn().mockResolvedValue([]),
  socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind: jest
    .fn()
    .mockResolvedValue([]),
};
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({ api: mockReads }));
jest.mock("../me-identity-list-settings-ai-chat/Component", () => ({
  Component: () => null,
}));
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock("./Component", () => ({ Component: () => null }));
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-download-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock("../me-social-module-profile-list-ai-chat/Component", () => ({
  Component: () => null,
}));
jest.mock("../me-social-module-profile-id-sidebar-ai-chat/Component", () => ({
  Component: () => null,
}));
jest.mock("../me-account-ai-chat/Component", () => ({ Component: () => null }));
jest.mock(
  "../me-social-module-profile-list-settings-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-navigation-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-avatar-update-ai-chat/Component",
  () => ({ Component: () => null }),
);
jest.mock(
  "../me-social-module-profile-id-sidebar-ai-chat/ClientComponent",
  () => ({ SourceFiles: () => null }),
);
import Reader0 from "../me-identity-list-settings-ai-chat/client";
import Reader1 from "../me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat/client";
import Reader2 from "./client";
import Reader3 from "../me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat/client";
import Reader4 from "../me-social-module-profile-id-chat-id-thread-id-download-ai-chat/client";
import Reader5 from "../me-social-module-profile-list-ai-chat/client";
import Reader6 from "../me-social-module-profile-id-sidebar-ai-chat/client";
import Reader7 from "../me-account-ai-chat/client";
import Reader8 from "../me-social-module-profile-list-settings-ai-chat/client";
import Reader9 from "../me-social-module-profile-id-navigation-ai-chat/client";
import Reader10 from "../me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat/client";
import Reader11 from "../me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat/client";
import Reader12 from "../me-social-module-profile-id-avatar-update-ai-chat/client";

const headers = {
  Authorization: "Bearer server-owner",
  "Cache-Control": "no-store",
};
const props = {
  isServer: true,
  data: { id: "owner" },
  apiProps: { options: { headers, next: { revalidate: 0 } } },
  profile: { id: "assistant" },
  profileId: "assistant",
  source: { id: "source" },
  project: {
    requesterProfileId: "requester",
    profile: { id: "assistant" },
    chat: { id: "chat" },
    thread: { id: "thread" },
  },
  thread: {
    id: "thread",
    metadata: {
      aiChatDocument: {
        key: "products",
        profileId: "assistant",
        sourceIds: ["source"],
      },
    },
  },
} as unknown as IComponentProps;
beforeEach(() => {
  for (const read of Object.values(mockReads))
    read.mockReset().mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isFetching: false,
      isSuccess: true,
      refetch: jest.fn(),
    });
});
it.each([
  ["me-identity-list-settings-ai-chat", Reader0],
  [
    "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
    Reader1,
  ],
  ["me-social-module-profile-id-chat-id-thread-id-ai-chat", Reader2],
  [
    "me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat",
    Reader3,
  ],
  ["me-social-module-profile-id-chat-id-thread-id-download-ai-chat", Reader4],
  ["me-social-module-profile-list-ai-chat", Reader5],
  ["me-social-module-profile-id-sidebar-ai-chat", Reader6],
  ["me-account-ai-chat", Reader7],
  ["me-social-module-profile-list-settings-ai-chat", Reader8],
  ["me-social-module-profile-id-navigation-ai-chat", Reader9],
  [
    "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat",
    Reader10,
  ],
  [
    "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat",
    Reader11,
  ],
  ["me-social-module-profile-id-avatar-update-ai-chat", Reader12],
])(
  "forwards caller headers to every specialized client SDK read in %s",
  async (_name, Reader) => {
    await Reader(props as any);
    const calls = Object.values(mockReads).flatMap((read) => read.mock.calls);
    expect(calls.length).toBeGreaterThan(0);
    for (const [request] of calls) {
      expect(request.options).toEqual(expect.objectContaining({ headers }));
    }
  },
);
