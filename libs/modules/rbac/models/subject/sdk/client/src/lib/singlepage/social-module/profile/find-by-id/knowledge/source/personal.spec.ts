import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
const addAction = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: any) => options,
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-api"),
  queryClient,
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));

import { consistencyQueryKey } from "@sps/shared-frontend-client-api";
import { action as create } from "./create";
import { action as update } from "./find-by-id/update";

it("updates only the owner's personal cache, preserving editable and keeping note text out of the action log", () => {
  const base =
    "/api/rbac/subjects/person/social-module/profiles/mine/knowledge/sources";
  const personal = consistencyQueryKey(
    base + "/personal?",
    undefined,
    "http://localhost:4000",
  );
  const peerPrincipal = [
    base + "/personal?",
    undefined,
    { principal: "other", host: "http://localhost:4000" },
  ];
  const other = [base.replace("/mine/", "/other/") + "/personal?"];
  for (const key of [personal, other, peerPrincipal, [base + "?"]])
    queryClient.setQueryData(key, []);
  const scope = { id: "person", socialModuleProfileId: "mine", personal: true };
  const row = { id: "note", content: "Original", editable: true };
  const createdAction: any = create(scope);
  createdAction.onSuccess(row, scope);
  expect(queryClient.getQueryData(personal)).toEqual([row]);
  const updatedAction: any = update({
    ...scope,
    knowledgeModuleSourceId: "note",
  });
  const changed = { ...row, content: "Edited" };
  updatedAction.onSuccess(changed, scope);
  expect(queryClient.getQueryData(personal)).toEqual([changed]);
  expect(queryClient.getQueryData(other)).toEqual([]);
  expect(queryClient.getQueryData([base + "?"])).toEqual([]);
  expect(queryClient.getQueryData(peerPrincipal)).toEqual([]);
  expect(addAction).not.toHaveBeenCalled();
});
