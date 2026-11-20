import { QueryClient } from "@tanstack/react-query";
import { update } from "./model-favorites";

const mockCache = new QueryClient();
const mockUpdate = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  get queryClient() {
    return mockCache;
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate: (
      props: unknown,
    ) => mockUpdate(props),
  },
}));

it("applies clearing favorites to cached chats of the same subject", async () => {
  const origin = {
    id: "owner",
    socialModuleProfileId: "a",
    socialModuleChatId: "1",
  };
  const key = (id: string, profile: string, chat: string) => [
    `/api/rbac/subjects/${id}/social-module/profiles/${profile}/chats/${chat}/openrouter/model-favorites`,
  ];
  const first = key("owner", "a", "1");
  const second = key("owner", "b", "2");
  const otherSubject = key("owner-2", "a", "1");
  const previous = { favoriteModelIds: ["openai/gpt-5.2"] };
  for (const item of [first, second, otherSubject])
    mockCache.setQueryData(item, previous);
  const cleared = { favoriteModelIds: [] };
  mockUpdate.mockResolvedValue(cleared);
  const mutation = update(origin) as unknown as {
    mutationFn: (
      input: typeof origin & { data: typeof cleared },
    ) => Promise<unknown>;
  };
  await mutation.mutationFn({ ...origin, data: cleared });
  expect(mockCache.getQueryData(first)).toEqual(cleared);
  expect(mockCache.getQueryData(second)).toEqual(cleared);
  expect(mockCache.getQueryData(otherSubject)).toEqual(previous);
  mockCache.clear();
});
