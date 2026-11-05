/** @jest-environment jsdom */
/** BDD: public stored text stays bounded and follows shared query/realtime ownership. */
jest.mock("client-only", () => ({}), { virtual: true });
const mockSubscription = jest.fn(() => jest.fn());
jest.mock("@sps/shared-frontend-client-api", () => {
  const { QueryClient } = jest.requireActual("@tanstack/react-query");
  return {
    queryClient: new QueryClient(),
    subscription: (...args: any[]) => mockSubscription(...args),
  };
});
import { renderHook, waitFor } from "@testing-library/react";
import { queryClient } from "@sps/shared-frontend-client-api";
import { FILE_PREVIEW_TEXT_MAX_BYTES } from "@sps/shared-utils";
import { action, readPreviewText } from "./preview-text";
import { action as download } from "./download";

const originalFetch = global.fetch;
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
});
afterAll(() => {
  global.fetch = originalFetch;
  queryClient.clear();
});

it("reads original UTF-8 text, carries file topics, preserves caller metadata and cleans up", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: new Headers(),
    arrayBuffer: async () => new TextEncoder().encode("# Привет").buffer,
  });
  const { result, unmount } = renderHook(() =>
    action({
      file: {
        id: "1a0f3940-f0b8-4c2f-92ab-5ea799c22c11",
        file: "/brief.md",
        updatedAt: "revision-1",
        size: 10,
      } as any,
      reactQueryOptions: { meta: { purpose: "preview" } },
    }),
  );
  await waitFor(() => expect(result.current.data).toBe("# Привет"));
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/public\/brief.md$/),
    expect.objectContaining({
      credentials: "omit",
      signal: expect.any(Object),
      cache: "no-store",
    }),
  );
  const query = queryClient.getQueryCache().getAll()[0];
  expect(query.meta?.topics).toContain("file-storage.files");
  expect(query.meta?.purpose).toBe("preview");
  const cleanup = mockSubscription.mock.results[0].value;
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it("cancels streamed bodies that exceed the limit without trusting Content-Length", async () => {
  const cancel = jest.fn();
  const releaseLock = jest.fn();
  const read = jest
    .fn()
    .mockResolvedValueOnce({
      done: false,
      value: new Uint8Array(FILE_PREVIEW_TEXT_MAX_BYTES),
    })
    .mockResolvedValueOnce({ done: false, value: new Uint8Array(1) });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: new Headers(),
    body: { getReader: () => ({ read, cancel, releaseLock }) },
  });
  await expect(
    readPreviewText("https://example.com/large.txt"),
  ).rejects.toThrow("too large");
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(releaseLock).toHaveBeenCalledTimes(1);
});

it("rejects failed responses and unsafe URLs", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  await expect(
    readPreviewText("https://example.com/notes.txt"),
  ).rejects.toThrow("could not be loaded");
  await expect(readPreviewText("javascript:alert(1)")).rejects.toThrow(
    "cannot be previewed",
  );
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it("downloads original bytes without credentials and forwards cancellation", async () => {
  const blob = new Blob(["original"]);
  const controller = new AbortController();
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, blob: async () => blob });
  await expect(
    download({
      src: "https://example.com/file.pdf",
      signal: controller.signal,
    }),
  ).resolves.toBe(blob);
  expect(global.fetch).toHaveBeenCalledWith("https://example.com/file.pdf", {
    credentials: "omit",
    signal: controller.signal,
  });
  await expect(download({ src: "javascript:alert(1)" })).rejects.toThrow(
    "cannot be downloaded",
  );
});
