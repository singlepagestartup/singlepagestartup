const authenticate = jest.fn();
const persist = jest.fn();
const resetQueries = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({ resetQueries }),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://localhost:4000",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationEmailAndPasswordAuthentication: (...args: unknown[]) =>
      authenticate(...args),
  },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({ Authorization: "Bearer guest-jwt" }),
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {},
}));
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("../persist-authentication-tokens", () => ({
  readAuthenticationTokens: () => ({ jwt: "guest-jwt" }),
  persistAuthenticationTokens: (...args: unknown[]) => persist(...args),
}));
jest.mock("../../social-module/profile/active-selection", () => ({
  readSocialModuleProfileSelections: () => ({ target: "assistant-profile" }),
}));
import { action } from "./authentication";

it("carries the guest session proof and target saved profile before replacing authentication tokens", async () => {
  authenticate.mockImplementation(async (request) => {
    expect(request.data).toEqual({
      login: "member@example.com",
      password: "secret",
      guestSessionToken: "guest-jwt",
      socialModuleProfileSelections: { target: "assistant-profile" },
    });
    expect(persist).not.toHaveBeenCalled();
    return { jwt: "member-jwt", refresh: "member-refresh" };
  });
  const mutation = action({}) as any;
  await mutation.mutationFn({
    data: { login: "member@example.com", password: "secret" },
  });
  expect(persist).toHaveBeenCalledWith({
    jwt: "member-jwt",
    refresh: "member-refresh",
  });
  expect(resetQueries).toHaveBeenCalledTimes(1);
});
