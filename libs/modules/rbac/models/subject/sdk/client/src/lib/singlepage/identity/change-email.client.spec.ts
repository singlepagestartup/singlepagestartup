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

import { request, verify } from "./change-email";
import { action as updateIdentity } from "./update";

beforeEach(() => {
  queryClient.clear();
  addAction.mockClear();
});

it("records verification stages without exposing codes or challenges to the event/debug store", () => {
  const input = {
    id: "owner",
    identityId: "identity",
    data: { code: "secret-code", challengeId: "secret-challenge" },
  };
  (request() as any).onSuccess({ challengeId: "secret-challenge" }, input);
  (verify() as any).onSuccess(
    { stage: "current-verified", verificationId: "secret-proof" },
    input,
  );
  expect(addAction).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(addAction.mock.calls)).not.toContain("secret");
  expect(addAction.mock.calls[1][0]).toEqual(
    expect.objectContaining({
      type: "mutation",
      name: "/api/rbac/subjects/owner/identities/identity/email-change/verify",
      result: { stage: "current-verified" },
    }),
  );
});

it("patches scoped and global identity lists and detail only when the new email is confirmed", () => {
  const scoped = "/api/rbac/subjects/owner/identities?";
  const original = { id: "identity", account: "old@example.com" };
  queryClient.setQueryData([scoped], [original]);
  queryClient.setQueryData(["/api/rbac/identities"], [original]);
  const detailKey = ["/api/rbac/identities/identity", undefined];
  queryClient.setQueryData(detailKey, original);
  const mutation = verify() as any;
  const input = { id: "owner", identityId: "identity" };
  mutation.onSuccess(
    { stage: "current-verified", verificationId: "proof" },
    input,
  );
  expect(queryClient.getQueryData([scoped])).toEqual([original]);
  const identity = { ...original, account: "new@example.com" };
  mutation.onSuccess({ stage: "complete", identity }, input);
  expect(queryClient.getQueryData([scoped])).toEqual([identity]);
  expect(queryClient.getQueryData(["/api/rbac/identities"])).toEqual([
    identity,
  ]);
  expect(queryClient.getQueryData(detailKey)).toEqual(identity);
});

it("updates factory identity detail keys before the consumer success callback", async () => {
  const detailKey = ["/api/rbac/identities/identity", "include=account"];
  const identity = { id: "identity", account: "new@example.com" };
  queryClient.setQueryData(detailKey, {
    ...identity,
    account: "old@example.com",
  });
  const onSuccess = jest.fn(() => {
    expect(queryClient.getQueryData(detailKey)).toEqual(identity);
  });
  await (updateIdentity({ reactQueryOptions: { onSuccess } }) as any).onSuccess(
    identity,
    { id: "owner" },
  );
  expect(onSuccess).toHaveBeenCalled();
});
