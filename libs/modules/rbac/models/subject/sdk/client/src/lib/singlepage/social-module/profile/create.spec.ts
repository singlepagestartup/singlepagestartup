import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
const addAction = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: unknown) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  queryClient,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

import { action } from "./create";
import { action as update } from "./find-by-id/update";

it("updates project lists, invalidates filtered lists and counts, and records the scoped mutation", () => {
  const scoped = "/api/rbac/subjects/owner/social-module/profiles";
  const filtered = `${scoped}?filters[and][0][column]=variant`;
  queryClient.setQueryData([scoped + "?"], []);
  queryClient.setQueryData([filtered], []);
  queryClient.setQueryData(["/api/social/profiles"], []);
  queryClient.setQueryData(["/api/social/profiles/count"], 0);
  const profile = { id: "new-profile", variant: "artificial-intelligence" };
  const variables = { id: "owner", data: { title: { en: "Project" } } };

  (action({ id: "owner" }) as any).onSuccess(profile, variables);

  expect(queryClient.getQueryData([scoped + "?"])).toEqual([profile]);
  expect(queryClient.getQueryData(["/api/social/profiles"])).toEqual([profile]);
  expect(queryClient.getQueryData([filtered])).toEqual([]);
  expect(queryClient.getQueryState([filtered])?.isInvalidated).toBe(true);
  expect(
    queryClient.getQueryState(["/api/social/profiles/count"])?.isInvalidated,
  ).toBe(true);
  expect(addAction).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "mutation",
      name: scoped,
      props: variables,
      result: profile,
    }),
  );
});

it("patches the actual factory Profile detail cache, including keys with query parameters", () => {
  const key = ["/api/social/profiles/profile", "language=en"];
  queryClient.setQueryData(key, { id: "profile", title: { en: "Old" } });
  const profile = { id: "profile", title: { en: "New" } };
  (update({}) as any).onSuccess(profile, { id: "owner" });
  expect(queryClient.getQueryData(key)).toEqual(profile);
});
