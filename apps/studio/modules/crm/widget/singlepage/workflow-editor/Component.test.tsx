import { expect, mock, test } from "bun:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { newStage, type Workflow } from "../../../shared/workflows";
import { Component } from "./Component";

test("keeps the selected material operations when a saved draft is reopened", async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = Object.getOwnPropertyDescriptors(globalThis);
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
  const workflow: Workflow = {
    id: "product-service",
    shopId: "shop",
    title: "Работа по фото",
    applicability: "После запроса клиента",
    goal: "Ответить с учётом фотографии",
    stages: [
      {
        ...newStage("reply"),
        title: "Ответить",
        assignee: "agent",
        payer: "shop",
        maxStageAmount: "100",
        maxRunAmount: "20",
        materials: ["vision"],
      },
    ],
  };
  const people = [
    { id: "agent", name: "Редактор", initials: "Р", kind: "agent" as const },
  ];
  const payers = [{ id: "shop", title: "Владелец" }];
  const save = mock((_draft: Workflow) => {});
  const host = dom.window.document.getElementById("root")!;
  const root = createRoot(host);
  async function open(data: Workflow, language = "ru", key = "before-save") {
    await act(async () =>
      root.render(
        <Component
          key={key}
          initialWorkflow={data}
          people={people}
          payers={payers}
          language={language}
          onSave={save}
        />,
      ),
    );
  }
  function label(text: string) {
    const label = [...host.querySelectorAll("label")].find(
      (node) => node.textContent === text,
    );
    if (!label) throw new Error(`No label for ${text}`);
    return label;
  }
  const checkbox = (name: string) => label(name).control as HTMLInputElement;
  async function submit() {
    const button = [...host.querySelectorAll("button")].find(
      (node) => node.textContent === "Сохранить воронку",
    );
    if (!button) throw new Error("No save action");
    await act(async () => button.click());
    return save.mock.calls.at(-1)![0];
  }
  try {
    await open(workflow);
    const image = checkbox("Проанализировать изображение");
    expect(image.checked).toBe(true);
    expect(image.nextElementSibling?.className).toContain(
      "peer-checked:bg-primary",
    );
    expect(image.labels?.length).toBe(1);
    expect(
      dom.window.document.getElementById(
        image.getAttribute("aria-describedby")!,
      )?.textContent,
    ).toContain("JPEG, PNG или WebP");
    expect(checkbox("Расшифровать аудио").checked).toBe(false);
    await act(async () => label("Проанализировать изображение").click());
    await act(async () => label("Расшифровать аудио").click());

    const saved = await submit();
    expect(saved.stages[0].materials).toEqual(["transcription"]);
    await open(saved, "en", "after-save");
    expect(checkbox("Analyze an image").checked).toBe(false);
    expect(checkbox("Transcribe audio").checked).toBe(true);
    expect(host.textContent).toContain(
      "Charges are based on actual model usage",
    );
    await act(async () => label("Transcribe audio").click());
    const cleared = await submit();
    expect(cleared.stages[0].materials).toEqual([]);
    await open(cleared, "en", "after-clear");
    expect([
      ...host.querySelectorAll('input[type="checkbox"]:checked'),
    ]).toHaveLength(0);
    await open(
      {
        ...workflow,
        stages: [{ ...workflow.stages[0], materials: undefined }],
      },
      "en",
      "without-options",
    );
    expect([
      ...host.querySelectorAll('input[type="checkbox"]:checked'),
    ]).toHaveLength(0);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const name of Object.keys(globals)) {
      const descriptor = previous[name];
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
