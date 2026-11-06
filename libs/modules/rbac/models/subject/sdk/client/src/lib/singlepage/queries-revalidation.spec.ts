const effects: Array<() => () => void> = [];
let subscribers: Array<(state: unknown) => void> = [];
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: (effect: () => () => void) => effects.push(effect),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    subscribe: (callback: (state: unknown) => void) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter((item) => item !== callback);
      };
    },
    getState: () => ({ addAction: jest.fn() }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

import { queryClient } from "@sps/shared-frontend-client-api";
import { action as profiles } from "./social-module/profile/find";
import { action as projects } from "./social-module/profile/projects";
import { action as avatar } from "./social-module/profile/find-by-id/avatar/find";
import { action as identities } from "./identity/find";
import { action as balance } from "./billing-module/balance";
import { action as me } from "./authentication/me";

const readers = [
  ["profiles", profiles, { id: "owner" }, "social.profiles"],
  ["projects", projects, { id: "owner" }, "social.chats-to-threads"],
  [
    "avatar",
    avatar,
    { id: "owner", socialModuleProfileId: "profile" },
    "file-storage.files",
  ],
  ["identities", identities, { id: "owner" }, "rbac.identities"],
  [
    "balance",
    balance,
    { id: "owner" },
    "rbac.subjects-to-billing-module-currencies",
  ],
  ["me", me, { subjectId: "owner" }, "rbac.subjects"],
] as const;

beforeEach(() => {
  effects.length = 0;
  queryClient.clear();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

it.each(readers)(
  "%s invalidates its cached data after a matching remote event and unsubscribes on unmount",
  async (_name, hook, props, topic) => {
    const options = (hook as any)({
      ...props,
      reactQueryOptions: { meta: { screen: "account" } },
    });
    expect(options.meta.screen).toBe("account");
    await queryClient.prefetchQuery({ ...options, queryFn: () => [] });
    const cleanup = effects[0]();
    const before = subscribers.length;
    for (const subscriber of [...subscribers])
      subscriber({
        getActionsFromStoreByName: () => [
          {
            result: {
              payload: "/api/other/mutation",
              topics: [topic],
              createdAt: new Date(Date.now() + 1).toISOString(),
            },
          },
        ],
      });
    jest.advanceTimersByTime(200);
    expect(queryClient.getQueryState(options.queryKey)?.isInvalidated).toBe(
      true,
    );
    cleanup();
    expect(subscribers).toHaveLength(before - 1);
  },
);

it.each(readers)(
  "%s accepts explicit caller topics without losing other query options",
  (_name, hook, props) => {
    const options = (hook as any)({
      ...props,
      reactQueryOptions: {
        enabled: false,
        meta: { topics: ["project.custom"], screen: "custom" },
      },
    });
    expect(options.enabled).toBe(false);
    expect(options.meta).toEqual({
      topics: ["project.custom"],
      screen: "custom",
    });
  },
);

it("isolates aggregate project caches by the authenticated Subject", () => {
  const owner = projects({ id: "owner" }) as any;
  const other = projects({ id: "other" }) as any;
  expect(owner.queryKey).not.toEqual(other.queryKey);
});
