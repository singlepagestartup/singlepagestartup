/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { FILE_PREVIEW_TEXT_MAX_BYTES } from "@sps/shared-utils";
import { FilePreview } from "./index";

const png = new Blob(
  [
    Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6/ccAAAAASUVORK5CYII=",
      ),
      (c) => c.charCodeAt(0),
    ),
  ],
  { type: "application/octet-stream" },
);
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
const originalObserver = global.IntersectionObserver;

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:fixture");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => {
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  global.IntersectionObserver = originalObserver;
});

it("loads a protected image when it reaches the rail, reuses it in the viewer and releases it on unmount", async () => {
  let visibility: IntersectionObserverCallback;
  global.IntersectionObserver = jest.fn((cb) => {
    visibility = cb;
    return { observe: jest.fn(), disconnect: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  const read = jest.fn(async (_signal?: AbortSignal) => png);
  const { container, unmount } = render(
    <FilePreview name="chart.png" onDownload={read} layout="rail" />,
  );
  expect(read).not.toHaveBeenCalled();
  act(() =>
    visibility(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
  await waitFor(() =>
    expect(container.querySelector("img")?.src).toBe("blob:fixture"),
  );
  act(() =>
    visibility(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
  expect(container.querySelector("img")?.src).toBe("blob:fixture");
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  const trigger = screen.getByRole("button", { name: "Preview chart.png" });
  expect(trigger.textContent).toContain("PNG");
  expect(trigger.querySelector("img")?.parentElement?.className).toContain(
    "size-[4.5rem]",
  );
  trigger.focus();
  fireEvent.click(trigger);
  expect(
    screen.getByRole("img", { name: "chart.png" }).getAttribute("src"),
  ).toBe("blob:fixture");
  fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
  expect(
    screen
      .getByRole("button", { name: "Exit full screen" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Exit full screen" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(read).toHaveBeenCalledTimes(1);
  unmount();
  expect(read.mock.calls[0][0]?.aborted).toBe(true);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fixture");
});

it("shows a message photo before a click and keeps it in the message after closing the viewer", async () => {
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as typeof IntersectionObserver;
  const read = jest.fn(async () => png);
  render(<FilePreview name="cover.png" onDownload={read} layout="message" />);
  const trigger = screen.getByRole("button", { name: "Preview cover.png" });
  await waitFor(() =>
    expect(trigger.querySelector("img")?.src).toBe("blob:fixture"),
  );
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog").querySelector("img")?.src).toBe(
    "blob:fixture",
  );
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(trigger.querySelector("img")?.src).toBe("blob:fixture");
  expect(read).toHaveBeenCalledTimes(1);
});

it("aborts an old private read and ignores its late response when the reader changes", async () => {
  let resolve!: (blob: Blob) => void;
  const previous = jest.fn(
    (_signal?: AbortSignal) =>
      new Promise<Blob>((done) => {
        resolve = done;
      }),
  );
  const next = jest.fn(
    async () => new Blob(["plain fixture"], { type: "image/png" }),
  );
  const { rerender } = render(
    <FilePreview name="same.png" onDownload={previous} layout="message" />,
  );
  rerender(<FilePreview name="same.png" onDownload={next} layout="message" />);
  expect(previous.mock.calls[0][0]?.aborted).toBe(true);
  await act(async () => resolve(png));
  await waitFor(() =>
    expect(screen.queryByText("Loading preview…")).toBeNull(),
  );
  expect(screen.getByRole("button", { name: "Preview same.png" })).toBeTruthy();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(document.querySelector("img, video, audio, iframe")).toBeNull();
});

it.each([
  ["voice.ogg", "audio", "OggS", "message"],
  ["clip.webm", "video", "\x1a\x45\xdf\xa3", "message"],
  ["voice.ogg", "audio", "OggS", "rail"],
  ["clip.webm", "video", "\x1a\x45\xdf\xa3", "rail"],
])(
  "waits for Play on %s (%s, %s) in the %s and opens a native player in the viewer",
  async (name, tag, bytes, layout) => {
    const read = jest.fn(
      async () => new Blob([Uint8Array.from(bytes, (c) => c.charCodeAt(0))]),
    );
    const { container, unmount } = render(
      <FilePreview
        name={name}
        layout={layout as "message" | "rail"}
        onDownload={read}
      />,
    );
    expect(read).not.toHaveBeenCalled();
    if (layout === "rail") {
      fireEvent.click(screen.getByRole("button", { name: `Play ${name}` }));
      await waitFor(() =>
        expect(container.querySelector(tag)?.hasAttribute("controls")).toBe(
          true,
        ),
      );
    } else {
      expect(screen.queryByRole("button", { name: `Play ${name}` })).toBeNull();
    }
    fireEvent.click(screen.getByRole("button", { name: `Preview ${name}` }));
    await waitFor(() =>
      expect(
        screen.getByRole("dialog").querySelector(tag)?.getAttribute("src"),
      ).toBe("blob:fixture"),
    );
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(read).toHaveBeenCalledTimes(1);
    unmount();
  },
);

it("reads private HTML on open, with a byte limit and the sandboxed renderer", async () => {
  const read = jest.fn(async () => new Blob(["<p>Shared notes</p>"]));
  render(<FilePreview name="notes.html" layout="message" onDownload={read} />);
  expect(read).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Preview notes.html" }));
  const iframe = await screen.findByTitle("HTML preview");
  expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
  expect(read).toHaveBeenCalledWith(
    expect.any(AbortSignal),
    FILE_PREVIEW_TEXT_MAX_BYTES,
  );
  expect(screen.queryByText("Shared notes")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});

it("offers the original download when private text exceeds the limit", async () => {
  const read = jest.fn(
    async () => new Blob([new Uint8Array(FILE_PREVIEW_TEXT_MAX_BYTES + 1)]),
  );
  render(<FilePreview name="notes.html" layout="message" onDownload={read} />);
  fireEvent.click(screen.getByRole("button", { name: "Preview notes.html" }));
  expect((await screen.findByRole("alert")).textContent).toContain("too large");
  expect(screen.queryByTitle("HTML preview")).toBeNull();
  expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
});
