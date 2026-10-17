/** @jest-environment jsdom */
/** BDD: a loaded File opens a modal without another metadata request; text is lazy. */
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
const mockMetadata = jest.fn(() => {
  throw new Error("Unexpected metadata read");
});
const mockText = jest.fn();
const mockProvider = jest.fn(({ children }: any) => children);
const mockDownload = jest.fn();
const mockRender = jest.fn(() => ({
  promise: Promise.resolve(),
  cancel: jest.fn(),
}));
jest.mock("pdfjs-dist/webpack.mjs", () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: async () => ({
        getViewport: ({ scale }: any) => ({
          width: 600 * scale,
          height: 800 * scale,
        }),
        render: (...args: any[]) => mockRender(...args),
      }),
    }),
    destroy: jest.fn(),
  }),
}));
jest.mock("@sps/file-storage/models/file/sdk/client", () => ({
  Provider: (props: any) => mockProvider(props),
  api: {
    findById: () => mockMetadata(),
    previewText: (props: any) => mockText(props),
    download: (props: any) => mockDownload(props),
  },
}));
jest.mock("@sps/file-storage/models/file/sdk/server", () => ({ api: {} }));
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";

const file = {
  id: "stored-file",
  file: "/file-storage/static/brief.md",
  adminTitle: "Brief.md",
  mimeType: "text/markdown",
  extension: "md",
};
beforeEach(() => {
  jest.clearAllMocks();
  mockText.mockReturnValue({
    data: "# Saved brief\n\n**Project notes**",
    isPending: false,
    isError: false,
  });
  mockDownload.mockResolvedValue({
    arrayBuffer: async () => new ArrayBuffer(4),
  });
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
});

it("reads stored Markdown only on open, switches to source, closes and restores focus", async () => {
  render(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: file,
      } as any)}
    />,
  );
  expect(mockText).not.toHaveBeenCalled();
  expect(mockMetadata).not.toHaveBeenCalled();
  expect(mockProvider).not.toHaveBeenCalled();
  const trigger = screen.getByRole("button", { name: "Preview Brief.md" });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Brief.md" });
  expect(
    within(dialog).getByRole("heading", { name: "Saved brief" }),
  ).toBeTruthy();
  expect(mockText).toHaveBeenCalledWith({ file });
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Source", exact: true }),
  );
  expect(within(dialog).getByText(/# Saved brief/).tagName).toBe("PRE");
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Close", exact: true }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(mockMetadata).not.toHaveBeenCalled();
});

it("renders PDF pages with zoom through the byte SDK without text or metadata reads", async () => {
  render(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: {
          ...file,
          file: "/guide.pdf",
          adminTitle: "Guide.pdf",
          extension: "pdf",
          mimeType: "application/pdf",
        },
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Guide.pdf" }));
  await waitFor(() => expect(screen.getByText("Page 1 of 2")).toBeTruthy());
  expect(mockDownload.mock.calls[0][0]).toEqual({
    src: expect.stringMatching(/\/public\/guide.pdf$/),
    signal: expect.any(AbortSignal),
  });
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  await waitFor(() =>
    expect(
      screen.getByRole("img", { name: "Page 2 of Guide.pdf" }),
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  expect(screen.getByText("125%")).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.getByRole("link", { name: "Open original" })).toBeTruthy();
  expect(mockText).not.toHaveBeenCalled();
  expect(mockMetadata).not.toHaveBeenCalled();
});

it("opens images with zoom and keeps legacy SVG blocked", () => {
  const view = render(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: {
          ...file,
          file: "/photo.png",
          adminTitle: "Photo.png",
          extension: "png",
          mimeType: "image/png",
        },
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Photo.png" }));
  expect(screen.getByRole("img", { name: "Photo.png" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  expect(screen.getByText("150%")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  view.rerender(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: { ...file, mimeType: "image/svg+xml; charset=utf-8" },
      } as any)}
    />,
  );
  expect(screen.getByText("Unsupported attachment")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

it("can move past a PDF page that failed to render", async () => {
  mockRender.mockImplementationOnce(() => ({
    promise: Promise.reject(new Error("Invalid page")),
    cancel: jest.fn(),
  }));
  render(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: {
          ...file,
          adminTitle: "Guide.pdf",
          extension: "pdf",
          mimeType: "application/pdf",
        },
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Guide.pdf" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "page could not be displayed",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("img", { name: "Page 2 of Guide.pdf" })).toBeTruthy();
});

it("shows a readable error and a retry while keeping the original available", () => {
  const retry = jest.fn();
  mockText.mockReturnValue({
    isPending: false,
    isError: true,
    error: { message: "File unavailable" },
    refetch: retry,
  });
  render(
    <FileStorageFile
      {...({
        isServer: false,
        variant: "attachment-ai-chat",
        dataSource: "props",
        data: file,
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Preview Brief.md" }));
  expect(screen.getByRole("alert").textContent).toBe("File unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link", { name: "Open original" })).toBeTruthy();
});
