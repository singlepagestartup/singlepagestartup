import { expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { FileDropZone } from "./FileDropZone";

test("desktop files activate the drop zone, survive nested drag events and attach on drop without intercepting card reordering", async () => {
  const dom = new JSDOM("<div id='root'></div>");
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = Object.fromEntries(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  const host = dom.window.document.getElementById("root")!;
  const root = createRoot(host);
  const received: File[][] = [];
  const transfer: { types: string[]; files: File[]; dropEffect: string } = {
    types: ["Files"],
    files: [],
    dropEffect: "none",
  };
  const drag = async (target: Element, type: string) => {
    const event = new dom.window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "dataTransfer", { value: transfer });
    await act(async () => {
      target.dispatchEvent(event);
    });
    return event;
  };
  const active = () => host.querySelector("[data-file-drop-active]");

  try {
    await act(async () =>
      root.render(
        <FileDropZone onFiles={(files) => received.push(files)}>
          <textarea aria-label="Message" />
          <div id="attachments">Existing attachments</div>
        </FileDropZone>,
      ),
    );
    const zone = host.firstElementChild!;
    const input = host.querySelector("textarea")!;
    const attachments = host.querySelector("#attachments")!;

    // Browsers hide the file list until drop; the Files type must be enough.
    expect((await drag(zone, "dragenter")).defaultPrevented).toBe(true);
    expect(active()).not.toBeNull();
    expect(host.textContent).toContain("Drop files to attach to this message");
    await drag(input, "dragenter");
    await drag(input, "dragleave");
    expect(active()).not.toBeNull();
    expect((await drag(attachments, "dragover")).defaultPrevented).toBe(true);
    expect(transfer.dropEffect).toBe("copy");

    const files = [
      new File(["photo"], "photo.png", { type: "image/png" }),
      new File(["brief"], "brief.md", { type: "text/markdown" }),
    ];
    transfer.files = files;
    expect((await drag(attachments, "drop")).defaultPrevented).toBe(true);
    expect(received).toHaveLength(1);
    expect(received[0][0]).toBe(files[0]);
    expect(received[0][1]).toBe(files[1]);
    expect(active()).toBeNull();

    transfer.types = ["text/plain"];
    transfer.files = [];
    expect((await drag(attachments, "dragenter")).defaultPrevented).toBe(false);
    expect((await drag(attachments, "dragover")).defaultPrevented).toBe(false);
    expect((await drag(attachments, "drop")).defaultPrevented).toBe(false);
    expect(active()).toBeNull();
    expect(received).toHaveLength(1);

    transfer.types = ["Files"];
    await drag(zone, "dragenter");
    await drag(zone, "dragleave");
    expect(active()).toBeNull();
    await drag(zone, "dragenter");
    await act(async () => {
      dom.window.dispatchEvent(new dom.window.Event("dragend"));
    });
    expect(active()).toBeNull();
    await drag(zone, "dragenter");
    await drag(input, "drop");
    expect(active()).toBeNull();
    expect(received).toHaveLength(1);
  } finally {
    await act(async () => root.unmount());
    for (const key of Object.keys(globals)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]!);
      else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close();
  }
});
