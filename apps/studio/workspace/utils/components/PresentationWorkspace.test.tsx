/** BDD Suite: Shared slide text and layout workspace
 * Given framework and startup decks keep all authored copy in their own source
 * When a slide is selected or exported
 * Then text and layout use that copy while the full PDF keeps every slide
 */
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { presentationPdfElements } from "./PresentationPdfDownload";
import { PresentationWorkspace } from "./PresentationWorkspace";
import {
  ProjectPresentation,
  requestedSlideIndex,
} from "./ProjectPresentation";

function sampleSlides() {
  return [
    {
      id: "offer",
      label: "The offer",
      title: "A startup-owned offer",
      lead: "Original offer copy",
      points: ["First benefit"],
    },
    {
      id: "value",
      label: "Its value",
      title: "The next step",
      lead: "A different slide",
      points: ["Second benefit"],
    },
  ];
}

function renderableSlides(data = sampleSlides()) {
  return data.map((slide) => ({
    id: slide.id,
    label: slide.label,
    content: createElement(
      "main",
      null,
      createElement("h1", null, slide.title),
      createElement("p", null, slide.lead),
    ),
  }));
}

describe("shared presentation workspace", () => {
  /** BDD Scenario: Direct export keeps the existing single-slide URL
   * Given a complete deck is rendered without the review workspace
   * When a valid slide number is requested or no valid number is present
   * Then the direct surface renders the requested slide or the complete deck
   */
  test("preserves direct full-deck and numbered-slide exports", () => {
    expect(
      requestedSlideIndex("?document=presentation&export=png&slide=1", 2),
    ).toBe(1);
    for (const search of [
      "",
      "?slide=",
      "?slide=-1",
      "?slide=2",
      "?slide=abc",
      "?slide=0.5",
    ])
      expect(requestedSlideIndex(search, 2)).toBeUndefined();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    try {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {
          location: { search: "?document=presentation&export=html&slide=1" },
        },
      });
      const single = renderToStaticMarkup(
        createElement(ProjectPresentation, {
          name: "Startup",
          slides: renderableSlides(),
        }),
      );
      expect(single).toContain('data-slide-id="value"');
      expect(single).not.toContain('data-slide-id="offer"');
      expect(single).toContain('data-slide-count="2"');
      expect(single).not.toContain("Presentation slides");
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { location: { search: "?document=presentation&export=html" } },
      });
      const full = renderToStaticMarkup(
        createElement(ProjectPresentation, {
          name: "Startup",
          slides: renderableSlides(),
        }),
      );
      expect(full.match(/data-slide-id=/g)).toHaveLength(2);
      expect(full).toContain("width:1600px;height:900px");
    } finally {
      if (previous) Object.defineProperty(globalThis, "window", previous);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("shows every slide layout with PNG and a complete PDF, without mode switches", () => {
    const html = renderToStaticMarkup(
      createElement(PresentationWorkspace, {
        name: "Startup service",
        fileName: "startup-deck",
        children: createElement(ProjectPresentation, {
          name: "Startup service",
          slides: renderableSlides(),
        }),
      }),
    );
    const dom = new JSDOM(html);
    const host = dom.window.document.body;
    expect(host.textContent).toContain("Original offer copy");
    expect(host.textContent).toContain("A different slide");
    expect(host.querySelectorAll("[data-artifact-frame]")).toHaveLength(2);
    expect(host.querySelectorAll("[data-slide-id]")).toHaveLength(2);
    expect(
      presentationPdfElements(host).map((el) => el.dataset.slideId),
    ).toEqual(["offer", "value"]);
    expect(host.querySelector("nav")).toBeNull();
    expect(
      host.querySelector('[aria-label="Представление слайда"]'),
    ).toBeNull();
    expect(host.textContent!.match(/Скачать PNG/g)).toHaveLength(2);
    expect(host.textContent!.match(/Подготовить PDF/g)).toHaveLength(1);
    dom.window.close();
  });
});

/** BDD Scenario: A downstream project retains its own fixed-size slide markup
 * Given a startup core presentation does not use the shared slide adapter
 * When the common workspace wraps its authored slides
 * Then PDF remains available without inventing slide text or losing the original content
 */
test("preserves PDF export for a custom startup deck", () => {
  const html = renderToStaticMarkup(
    createElement(PresentationWorkspace, {
      name: "Local course",
      fileName: "local-course",
      children: createElement(
        "div",
        null,
        ...["local-intro", "local-offer"].map((id) =>
          createElement(
            "section",
            {
              key: id,
              "data-slide-id": id,
              style: { width: 640, height: 360 },
            },
            id,
          ),
        ),
      ),
    }),
  );
  expect(html.match(/>Подготовить PDF</g)).toHaveLength(1);
  expect(html.match(/data-slide-id=/g)).toHaveLength(2);
  expect(html).toContain("local-offer");
  expect(html).not.toContain("Choose a slide");
  expect(html).not.toContain('aria-label="Слайды презентации"');
});

/** BDD Scenario: A selected slide is also visible beside the complete export deck
 * Given two authored slides and a duplicate preview of the selected slide
 * When PDF selects its source elements
 * Then it exports exactly two pages, while raw custom decks still export their mounted slides
 */
test("exports the complete deck without duplicating the selected preview", () => {
  const dom = new JSDOM(
    `<main><div data-presentation-pdf-deck><section data-slide-id="first"></section><section data-slide-id="second"></section></div><section data-slide-id="second"></section></main>`,
  );
  const root = dom.window.document.querySelector("main")!;
  expect(
    presentationPdfElements(root).map((element) => element.dataset.slideId),
  ).toEqual(["first", "second"]);
  root.innerHTML = `<section data-slide-id="custom-first"></section><section data-slide-id="custom-second"></section>`;
  expect(
    presentationPdfElements(root).map((element) => element.dataset.slideId),
  ).toEqual(["custom-first", "custom-second"]);
  expect(presentationPdfElements(null)).toEqual([]);
  dom.window.close();
});
