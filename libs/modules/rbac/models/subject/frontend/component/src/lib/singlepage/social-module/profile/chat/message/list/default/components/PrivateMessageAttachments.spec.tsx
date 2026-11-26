/** @jest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";

const mockDownload = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkAttachment: (...args: unknown[]) => mockDownload(...args),
  },
}));

it("shows the filename and uses only an authenticated download for a script", async () => {
  jest.useFakeTimers();
  const file = new Blob(["const fixture = 1;"], {
    type: "text/javascript",
  });
  mockDownload.mockResolvedValueOnce(file);
  const original = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => "blob:fixture");
  URL.revokeObjectURL = jest.fn();
  const download = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    download(this.href, this.download);
  });
  try {
    const { container } = render(
      <PrivateMessageAttachments
        subjectId="buyer"
        threadId="thread"
        messageId="message"
        attachments={[{ id: "file", name: "preview.js" }]}
        language="en"
      />,
    );
    expect(container.querySelector("a, iframe, object, embed, img")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Download preview.js" }),
    );
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith("blob:fixture", "preview.js"),
    );
    expect(URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "application/octet-stream" }),
    );
    expect(mockDownload).toHaveBeenCalledWith({
      id: "buyer",
      threadId: "thread",
      messageId: "message",
      attachmentId: "file",
      options: { signal: expect.any(AbortSignal) },
      maxBytes: undefined,
    });
  } finally {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    URL.createObjectURL = original;
    URL.revokeObjectURL = originalRevoke;
    jest.restoreAllMocks();
  }
});

const scope = {
  subjectId: "employee",
  threadId: "training-thread",
  messageId: "training-message",
  language: "en",
};

const originalCreateUrl = URL.createObjectURL;
const originalRevokeUrl = URL.revokeObjectURL;

describe("protected media", () => {
  beforeEach(() => {
    mockDownload.mockReset();
    URL.createObjectURL = jest.fn(() => "blob:authorized-media");
    URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreateUrl;
    URL.revokeObjectURL = originalRevokeUrl;
  });

  it("opens an older image with only an ID and name using the signed-in subject's original message", async () => {
    mockDownload.mockResolvedValue(
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/5FsAAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "application/octet-stream" },
      ),
    );
    const { container, unmount } = render(
      <PrivateMessageAttachments
        {...scope}
        attachments={[{ id: "file", name: "Reference.png" }]}
      />,
    );
    await waitFor(() =>
      expect(container.querySelector("img")?.getAttribute("src")).toBe(
        "blob:authorized-media",
      ),
    );
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "employee",
        threadId: "training-thread",
        messageId: "training-message",
        attachmentId: "file",
        options: { signal: expect.any(AbortSignal) },
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview Reference.png" }),
    );
    const dialog = within(
      screen.getByRole("dialog", { name: "Reference.png" }),
    );
    expect(
      dialog.getByRole("img", { name: "Reference.png" }).getAttribute("src"),
    ).toBe("blob:authorized-media");
    expect(dialog.queryByRole("link")).toBeNull();
    expect(mockDownload).toHaveBeenCalledTimes(1);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:authorized-media");
  });

  it("plays media from the task workspace in the Files sidebar using the scoped downloader", async () => {
    const download = jest.fn().mockResolvedValue(
      new Blob([Uint8Array.of(0, 0, 0, 24), "ftypisom"], {
        type: "application/octet-stream",
      }),
    );
    const { container } = render(
      <PrivateMessageAttachments
        {...scope}
        subjectId="manager"
        layout="rail"
        language="en"
        onDownload={download}
        attachments={[
          { id: "clip", name: "Walkthrough.mp4", mimeType: "video/mp4" },
        ]}
      />,
    );
    expect(download).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", {
      name: "Play Walkthrough.mp4",
    });
    fireEvent.click(trigger);
    await waitFor(() =>
      expect(
        document.querySelector("video[controls]")?.getAttribute("src"),
      ).toBe("blob:authorized-media"),
    );
    expect(download).toHaveBeenCalledWith(
      "training-message",
      "clip",
      expect.any(AbortSignal),
      undefined,
    );
    expect(mockDownload).not.toHaveBeenCalled();
    expect(container.querySelector("a[href]")).toBeNull();
  });

  it("reads protected HTML only when opened and displays it in the sandboxed viewer", async () => {
    const source = "<h1>Release notes</h1>";
    mockDownload.mockResolvedValue(
      new Blob([source], { type: "application/octet-stream" }),
    );
    render(
      <PrivateMessageAttachments
        {...scope}
        attachments={[{ id: "notes", name: "Notes.html" }]}
      />,
    );
    expect(mockDownload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Preview Notes.html" }));
    const frame = await screen.findByTitle("HTML preview");
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(screen.queryByRole("heading", { name: "Release notes" })).toBeNull();
    expect(mockDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: "notes",
        options: { signal: expect.any(AbortSignal) },
        maxBytes: 2 * 1024 * 1024,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    expect(screen.getByText(source).tagName).toBe("PRE");
  });

  it("discards an in-flight thumbnail when the signed-in subject changes", async () => {
    let resolveFirst!: (blob: Blob) => void;
    mockDownload.mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    mockDownload.mockRejectedValueOnce(new Error("Forbidden"));
    const attachment = [{ id: "file", name: "Original.png" }];
    const { container, rerender } = render(
      <PrivateMessageAttachments
        {...scope}
        attachments={attachment}
        layout="rail"
      />,
    );
    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(1));
    const signal = mockDownload.mock.calls[0][0].options.signal as AbortSignal;
    rerender(
      <PrivateMessageAttachments
        {...scope}
        attachments={attachment}
        layout="rail"
        subjectId="other"
      />,
    );
    await waitFor(() => expect(mockDownload).toHaveBeenCalledTimes(2));
    expect(signal.aborted).toBe(true);
    await act(async () =>
      resolveFirst(new Blob(["fixture"], { type: "image/png" })),
    );
    expect(container.querySelector("img[src],a[href]")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
