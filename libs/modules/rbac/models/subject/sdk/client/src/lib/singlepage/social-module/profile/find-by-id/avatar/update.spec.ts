const mockFindAll = jest.fn();
const mockAppend = jest.fn();
const mockRemove = jest.fn();
const mockSetQueryData = jest.fn();
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: jest.fn() }) },
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  clientHost: "http://localhost",
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: jest.fn(),
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: {
    getQueryCache: () => ({ findAll: mockFindAll }),
    setQueryData: mockSetQueryData,
  },
  appendToListQueries: mockAppend,
  removeFromListQueries: mockRemove,
}));
jest.mock("@tanstack/react-query", () => ({
  useMutation: (props: unknown) => props,
}));

import { action } from "./update";

describe("Own-profile avatar cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockReturnValue([
      {
        state: {
          data: [
            { id: "old-link", profileId: "own-profile" },
            { id: "other-link", profileId: "other-profile" },
            { id: "new-link", profileId: "own-profile" },
          ],
        },
      },
    ]);
  });

  test("removal clears only the affected profile links and handles a null result", () => {
    const mutation = action({}) as any;
    mutation.onSuccess(
      { file: null, relation: null },
      { id: "owner", socialModuleProfileId: "own-profile" },
    );
    expect(mockRemove.mock.calls.map((args) => args[2])).toEqual([
      "old-link",
      "new-link",
    ]);
    expect(mockAppend).not.toHaveBeenCalled();
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["/api/rbac/subjects/owner/social-module/profiles/own-profile/avatar"],
      { file: null, relation: null },
    );
  });

  test("replacement preserves the returned link and updates the file cache", () => {
    const mutation = action({}) as any;
    const relation = { id: "new-link", profileId: "own-profile" };
    const file = { id: "new-file" };
    mutation.onSuccess(
      { file, relation },
      { socialModuleProfileId: "own-profile" },
    );
    expect(mockRemove.mock.calls.map((args) => args[2])).toEqual(["old-link"]);
    expect(mockAppend).toHaveBeenCalledWith(
      expect.anything(),
      "/api/social/profiles-to-file-storage-module-files",
      relation,
    );
    expect(mockAppend).toHaveBeenCalledWith(
      expect.anything(),
      "/api/file-storage/files",
      file,
    );
  });
});
