/** @jest-environment jsdom */
import { actions } from "@sps/shared-frontend-api";
import { toast } from "sonner";
import { query } from "./index";

jest.mock("@sps/shared-frontend-api", () => ({ actions: { find: jest.fn() } }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("../../../request-limmiter", () => ({
  requestLimiter: { run: (run: () => unknown) => run() },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  authorization: { parseJwt: jest.fn() },
  saturateHeaders: (headers: unknown) => headers,
}));

beforeEach(() => jest.clearAllMocks());

it("keeps retries of one unreachable endpoint in one notification and preserves the failure for recovery", async () => {
  jest.mocked(actions.find).mockRejectedValue(new TypeError("Failed to fetch"));
  const read = query({ host: "http://api.test", route: "/api/social/chats" });
  await expect(read()).rejects.toThrow("Failed to fetch");
  await expect(read()).rejects.toThrow("Failed to fetch");
  expect(toast.error).toHaveBeenCalledWith("Connection error", {
    id: "api-read:http://api.test/api/social/chats",
    description: "Couldn’t reach the server. Try again.",
  });
  expect(jest.mocked(toast.error).mock.calls[0][1]?.id).toBe(
    jest.mocked(toast.error).mock.calls[1][1]?.id,
  );
});

it("keeps a server permission denial distinct from a transport failure", async () => {
  const denied = Object.assign(new Error("Permission denied"), { status: 403 });
  jest.mocked(actions.find).mockRejectedValue(denied);
  await expect(
    query({ host: "http://api.test", route: "/api/social/chats" })(),
  ).rejects.toBe(denied);
  expect(toast.error).toHaveBeenCalledWith("Permission denied", {
    id: "api-read:http://api.test/api/social/chats",
  });
});
