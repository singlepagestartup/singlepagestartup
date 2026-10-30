/** @jest-environment jsdom */
/** BDD: granted client media uses scoped authenticated bytes and releases them on access loss. */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, StrictMode } from "react";

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
const mockContent = jest.fn();
const mockFindById = jest.fn();
const mockServerFindById = jest.fn();
const mockProvider = jest.fn(({ children }: any) => children);
const mockSubscription = jest.fn(() => jest.fn());
jest.mock("@sps/file-storage/models/file/sdk/client", () => ({
  api: {
    content: (...args: any[]) => mockContent(...args),
    findById: (...args: any[]) => mockFindById(...args),
  },
  Provider: (props: any) => mockProvider(props),
}));
jest.mock("@sps/file-storage/models/file/sdk/server", () => ({
  api: { findById: (...args: any[]) => mockServerFindById(...args) },
}));
jest.mock("@sps/file-storage/models/file/sdk/model", () => ({
  route: "/api/file-storage/files",
  clientHost: "https://api.example.com",
}));
jest.mock("@sps/shared-frontend-client-api", () => {
  const { QueryClient } = jest.requireActual("@tanstack/react-query");
  return {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
    consistencyQueryKey: (path: string, params: unknown, host: string) => [
      path,
      params,
      { host, principal: "subject-a" },
    ],
    subscription: (...args: any[]) => mockSubscription(...args),
  };
});
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));
jest.mock("@sps/shared-utils", () => ({
  NEXT_PUBLIC_API_SERVICE_URL: "https://api.example.com",
  deriveTopicsFromPath: () => ["file-storage.files"],
}));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => createElement("img", { ...props, fill: undefined }),
}));
// Unrelated admin/attachment variants do not participate in this public reader path.
jest.mock("../find", () => ({ Component: () => null }));
jest.mock("../admin-v2/sidebar-item", () => ({ Component: () => null }));
jest.mock("../admin-v2/card", () => ({ Component: () => null }));
jest.mock("../admin-v2/form", () => ({ Component: () => null }));
jest.mock("../admin-v2/select-input", () => ({ Component: () => null }));
jest.mock("../admin-v2/table", () => ({ Component: () => null }));
jest.mock("../admin-v2/table-row", () => ({ Component: () => null }));
jest.mock("../admin/form", () => ({ Component: () => null }));
jest.mock("../admin/select-input", () => ({ Component: () => null }));
jest.mock("../admin/table", () => ({ Component: () => null }));
jest.mock("../admin/table-row", () => ({ Component: () => null }));
jest.mock("../attachment-ai-chat", () => ({ Component: () => null }));

import { queryClient } from "@sps/shared-frontend-client-api";
import { Component as File, ProtectedMediaProvider } from "../../../index";
import { Component as ServerReader } from "@sps/shared-frontend-components/singlepage/default/server";

const file = {
  id: "private-file",
  file: "/protected-original.png",
  mimeType: "image/png",
  extension: "png",
  updatedAt: "revision-1",
  adminTitle: "Private media",
  alt: "Private alternative text",
  width: 640,
  height: 480,
};
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
let blobCounter = 0;

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  blobCounter = 0;
  URL.createObjectURL = jest.fn(() => `blob:protected-${++blobCounter}`);
  URL.revokeObjectURL = jest.fn();
  mockContent.mockResolvedValue(
    new Blob(["PRIVATE-BYTES"], { type: "image/png" }),
  );
});
afterAll(() => {
  queryClient.clear();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

function media(
  options: {
    scope?: string;
    record?: any;
    variant?: "default" | "authenticated-content";
  } = {},
) {
  const child = (
    <File
      isServer={false}
      variant={options.variant || "default"}
      dataSource="props"
      data={(options.record || file) as any}
      language="en"
    />
  );
  return options.scope ? (
    <ProtectedMediaProvider scopeKey={options.scope}>
      {child}
    </ProtectedMediaProvider>
  ) : (
    child
  );
}

it("retains public SSR output and the ordinary metadata reader without a binary request", async () => {
  const html = renderToStaticMarkup(media());
  expect(html).toContain(
    "https://api.example.com/public/protected-original.png",
  );
  expect(mockContent).not.toHaveBeenCalled();
  mockFindById.mockReturnValue({ data: file, isLoading: false });
  const { unmount } = render(
    <File
      isServer={false}
      variant="default"
      data={file as any}
      language="en"
    />,
  );
  expect(mockFindById).toHaveBeenCalledWith({
    id: file.id,
  });
  expect(mockProvider).toHaveBeenCalledTimes(1);
  unmount();
  mockServerFindById.mockResolvedValue(file);
  const result = await ServerReader({
    isServer: true,
    variant: "default",
    data: { id: file.id },
    api: { findById: mockServerFindById },
    Component: () => null,
    Skeleton: () => null,
  } as any);
  expect(result!.props.data).toBe(file);
});

it("loads protected image bytes through the SDK from the registered public path without metadata reads or another Provider", async () => {
  const { container, unmount } = render(
    media({ scope: "subject-a/article/slot" }),
  );
  await waitFor(() =>
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:protected-1",
    ),
  );
  expect(mockContent).toHaveBeenCalledTimes(1);
  expect(mockContent).toHaveBeenCalledWith({
    id: file.id,
    options: { signal: expect.any(Object), cache: "no-store" },
  });
  expect(mockFindById).not.toHaveBeenCalled();
  expect(mockServerFindById).not.toHaveBeenCalled();
  expect(mockProvider).not.toHaveBeenCalled();
  expect(container.innerHTML).not.toContain("/public/");
  expect(container.querySelector("img")?.alt).toBe(file.alt);
  expect(queryClient.getQueryCache().getAll()[0].meta?.topics).toContain(
    "file-storage.files",
  );
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-1");
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(mockSubscription.mock.results[0].value).toHaveBeenCalledTimes(1);
});

it.each([
  ["video/mp4", "mp4", "video source"],
  ["audio/mpeg", "mp3", "audio source"],
  ["application/pdf", "pdf", "a[download]"],
])("uses Blob URLs for protected %s", async (mimeType, extension, selector) => {
  const { container, unmount } = render(
    media({
      scope: "subject-a/article/slot",
      record: { ...file, mimeType, extension },
    }),
  );
  await waitFor(() => expect(container.querySelector(selector)).not.toBeNull());
  const element = container.querySelector(selector)!;
  expect(
    element.getAttribute(
      selector.startsWith("a") && selector.includes("download")
        ? "href"
        : "src",
    ),
  ).toBe("blob:protected-1");
  expect(container.innerHTML).not.toContain("/public/");
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-1");
});

it("does not read outside a granted scope or render protected media during SSR", () => {
  const { unmount } = render(media({ variant: "authenticated-content" }));
  expect(mockContent).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockContent).not.toHaveBeenCalled();
  unmount();
  const html = renderToStaticMarkup(
    <File
      isServer={true}
      variant="authenticated-content"
      dataSource="props"
      data={file as any}
      language="en"
    />,
  );
  expect(html).not.toContain(file.file);
  expect(mockContent).not.toHaveBeenCalled();
});

it("aborts pending requests and removes private query data when access unmounts", async () => {
  let signal: AbortSignal | undefined;
  mockContent.mockImplementation((props) => {
    signal = props.options.signal;
    return new Promise(() => {});
  });
  const { unmount } = render(media({ scope: "subject-a/article/slot" }));
  await waitFor(() => expect(signal).toBeDefined());
  unmount();
  expect(signal!.aborted).toBe(true);
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it("resets Blob URLs and the previous principal's query cache on scope change", async () => {
  const { container, rerender, unmount } = render(
    media({ scope: "subject-a/article/slot" }),
  );
  await waitFor(() =>
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:protected-1",
    ),
  );
  rerender(media({ scope: "subject-b/article/slot" }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-1");
  expect(container.querySelector('img[src="blob:protected-1"]')).toBeNull();
  await waitFor(() =>
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:protected-2",
    ),
  );
  expect(
    queryClient
      .getQueryCache()
      .getAll()
      .every(
        (query) => query.meta?.protectedMediaScope === "subject-b/article/slot",
      ),
  ).toBe(true);
  unmount();
});

it("clears a displayed Blob immediately after a 403 refetch and retains it for transient errors", async () => {
  const { container, unmount } = render(
    media({ scope: "subject-a/article/slot" }),
  );
  await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
  mockContent.mockRejectedValueOnce(new Error("Temporary failure"));
  await act(async () => {
    await queryClient.refetchQueries();
  });
  expect(container.querySelector("img")?.getAttribute("src")).toBe(
    "blob:protected-1",
  );
  mockContent.mockRejectedValueOnce(
    Object.assign(new Error("Forbidden"), { status: 403 }),
  );
  await act(async () => {
    await queryClient.refetchQueries();
  });
  await waitFor(() => expect(container.querySelector("img")).toBeNull());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-1");
  unmount();
});

it("retains a subscribed scoped query after StrictMode cleanup and remount", async () => {
  const { container, unmount } = render(
    <StrictMode>{media({ scope: "subject-a/article/slot" })}</StrictMode>,
  );
  await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
  expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  unmount();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
});

it.each(["video/mp4", "audio/mpeg"])(
  "reloads native %s when protected bytes change",
  async (mimeType) => {
    const tag = mimeType.startsWith("video") ? "video" : "audio";
    const { container, unmount } = render(
      media({ scope: "subject-a/article/slot", record: { ...file, mimeType } }),
    );
    await waitFor(() =>
      expect(
        container.querySelector(`${tag} source`)?.getAttribute("src"),
      ).toBe("blob:protected-1"),
    );
    const previous = container.querySelector(tag);
    mockContent.mockResolvedValueOnce(
      new Blob(["UPDATED-PRIVATE-BYTES"], { type: mimeType }),
    );
    await act(async () => {
      await queryClient.refetchQueries();
    });
    await waitFor(() =>
      expect(
        container.querySelector(`${tag} source`)?.getAttribute("src"),
      ).toBe("blob:protected-2"),
    );
    expect(container.querySelector(tag)).not.toBe(previous);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:protected-1");
    unmount();
  },
);
