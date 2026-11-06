import { expect, mock, test } from "bun:test";
import { act, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { reorderFile } from "./utils";
import type { FileDropPosition, ILocalFile } from "./interface";

mock.module("./Preview", () => ({
  FilePreview: ({ file }: { file: ILocalFile }) => (
    <button type="button">{file.name}</button>
  ),
}));
mock.module("../primitives", () => ({
  Icon: () => <svg />,
  kit: { focus: "", muted: "" },
}));

test("drop markers identify the committed insertion edge and clear on drop, leave and cancel", async () => {
  const { DraftAttachments } = await import("./DraftAttachments");
  const dom = new JSDOM("<div id='root'></div><div id='outside'></div>");
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
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

  function Harness() {
    const [files, setFiles] = useState<ILocalFile[]>(
      ["A", "B", "C", "D"].map((id) => ({
        id,
        name: `${id}.txt`,
        type: "text/plain",
        size: 1,
      })),
    );
    const remove = useCallback(
      (id: string) =>
        setFiles((current) => current.filter((file) => file.id !== id)),
      [],
    );
    const reorder = useCallback(
      (id: string, targetId: string, position: FileDropPosition) =>
        setFiles((current) => reorderFile(current, id, targetId, position)),
      [],
    );
    return (
      <DraftAttachments files={files} onRemove={remove} onReorder={reorder} />
    );
  }

  const host = dom.window.document.getElementById("root")!;
  const root = createRoot(host);
  const card = (id: string) =>
    host.querySelector<HTMLElement>(`[data-file-id="${id}"]`)!;
  const order = () =>
    [...host.querySelectorAll("[data-file-id]")].map((element) =>
      element.getAttribute("data-file-id"),
    );
  const data = new Map<string, string>();
  const transfer = {
    setData: (type: string, value: string) => data.set(type, value),
    getData: (type: string) => data.get(type) ?? "",
    effectAllowed: "",
    dropEffect: "",
  };
  const drag = async (
    element: Element,
    type: string,
    clientX = 0,
    relatedTarget: EventTarget | null = null,
  ) => {
    const event = new dom.window.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      relatedTarget,
    });
    Object.defineProperty(event, "dataTransfer", { value: transfer });
    await act(async () => {
      element.dispatchEvent(event);
    });
  };

  try {
    await act(async () => root.render(<Harness />));
    for (const element of host.querySelectorAll<HTMLElement>("[data-file-id]"))
      element.getBoundingClientRect = () =>
        ({ left: 100, width: 160 }) as DOMRect;
    expect(host.querySelector('[aria-label^="Move "]')).toBeNull();

    await drag(card("A"), "dragstart");
    await drag(card("C"), "dragover", 120);
    expect(card("C").dataset.dropPosition).toBe("before");
    expect(host.querySelector('[data-drop-indicator="before"]')).not.toBeNull();
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Drop before C.txt",
    );
    expect(card("A").className).toContain("opacity-40");
    await drag(card("C"), "dragover", 240);
    expect(card("C").dataset.dropPosition).toBe("after");
    expect(host.querySelector('[data-drop-indicator="before"]')).toBeNull();
    await drag(card("C"), "drop", 240);
    expect(order()).toEqual(["B", "C", "A", "D"]);
    expect(host.querySelector("[data-drop-indicator]")).toBeNull();
    expect(card("A").className).not.toContain("opacity-40");

    await drag(card("D"), "dragstart");
    await drag(card("B"), "dragover", 120);
    await drag(card("B"), "drop", 120);
    expect(order()).toEqual(["D", "B", "C", "A"]);

    await drag(card("D"), "dragstart");
    await drag(card("A"), "dragover", 240);
    await drag(card("D"), "dragend");
    expect(host.querySelector("[data-drop-indicator]")).toBeNull();
    expect(order()).toEqual(["D", "B", "C", "A"]);

    await drag(card("D"), "dragstart");
    await drag(card("A"), "dragover", 240);
    await drag(
      host.querySelector("ul")!,
      "dragleave",
      0,
      dom.window.document.getElementById("outside"),
    );
    expect(host.querySelector("[data-drop-indicator]")).toBeNull();
    await drag(card("D"), "dragend");

    await drag(card("D"), "dragstart");
    await drag(card("A"), "dragover", 240);
    data.set("text/plain", "unrelated-text");
    await drag(card("A"), "drop", 240);
    expect(order()).toEqual(["D", "B", "C", "A"]);
    expect(host.querySelector("[data-drop-indicator]")).toBeNull();
  } finally {
    await act(async () => root.unmount());
    for (const key of Object.keys(globals)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]!);
      else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close();
  }
});
