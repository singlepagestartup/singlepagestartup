/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useChatScroll } from ".";

let resize: () => void;
const originalRect = HTMLElement.prototype.getBoundingClientRect;
const height = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight",
);
const client = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight",
);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      return this.hasAttribute("data-ai-chat-messages")
        ? this.querySelectorAll("article").length * 40
        : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return 200;
    },
  });
  HTMLElement.prototype.getBoundingClientRect = function () {
    const container = this.closest<HTMLElement>("[data-ai-chat-messages]");
    const index =
      this.tagName === "ARTICLE"
        ? Array.from(container!.querySelectorAll("article")).indexOf(this)
        : -1;
    const top = index < 0 ? 0 : index * 40 - (container?.scrollTop || 0);
    return {
      top,
      bottom: top + 40,
      left: 0,
      right: 100,
      height: 40,
      width: 100,
      x: 0,
      y: top,
      toJSON() {},
    };
  };
  (globalThis as any).ResizeObserver = class {
    constructor(callback: () => void) {
      resize = callback;
    }
    observe() {}
    disconnect() {}
  };
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  if (height)
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", height);
  else delete (HTMLElement.prototype as any).scrollHeight;
  if (client)
    Object.defineProperty(HTMLElement.prototype, "clientHeight", client);
  else delete (HTMLElement.prototype as any).clientHeight;
});
function View({
  ids,
  identity = "thread",
}: {
  ids: string[];
  identity?: string;
}) {
  const { list, hasNew, followLatest } = useChatScroll({
    identity,
    count: ids.length,
    revision: ids.join(","),
  });
  return (
    <div data-ai-chat-messages data-testid="pane">
      <div ref={list}>
        {ids.map((id) => (
          <article key={id} data-id={id}>
            {id}
          </article>
        ))}
      </div>
      {hasNew ? <button onClick={followLatest}>New messages</button> : null}
    </div>
  );
}
it("preserves a history anchor across append, delete and resize; explicit follow returns to the end", () => {
  const ids = Array.from({ length: 30 }, (_, i) => String(i));
  const { rerender } = render(<View ids={ids} />);
  const pane = screen.getByTestId("pane");
  expect(pane.scrollTop).toBe(1200);
  pane.scrollTop = 400;
  fireEvent.scroll(pane);
  rerender(<View ids={[...ids, "incoming"]} />);
  expect(pane.scrollTop).toBe(400);
  expect(screen.getByRole("button").textContent).toBe("New messages");
  rerender(<View ids={["prepended", ...ids, "incoming"]} />);
  expect(pane.scrollTop).toBe(440);
  rerender(
    <View
      ids={["prepended", ...ids.filter((id) => id !== "10"), "incoming"]}
    />,
  );
  expect(pane.scrollTop).toBe(400);
  act(() => resize());
  expect(pane.scrollTop).toBe(400);
  fireEvent.click(screen.getByRole("button"));
  expect(pane.scrollTop).toBe(1240);
  rerender(<View ids={ids} identity="another" />);
  expect(pane.scrollTop).toBe(1200);
});
