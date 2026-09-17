/** BDD Suite: Shared slide text and layout workspace
 * Given framework and startup decks keep all authored copy in their own source
 * When a slide is selected or exported
 * Then text and layout use that copy while the full PDF keeps every slide
 */
import { describe, expect, test } from "bun:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { presentationPdfElements } from "./PresentationPdfDownload";
import {
  PresentationWorkspace,
  presentationSlideMarkdown,
  resolvePresentationSlideText,
} from "./PresentationWorkspace";
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
  /** BDD Scenario: Source copy remains shared across representations
   * Given a slide has source-owned headings, points and action copy
   * When its copy changes and the text projection is derived again
   * Then the projection includes the revised copy without a separate Markdown source
   */
  test("derives current slide text from its owning data", () => {
    const source = {
      title: "Revised offer",
      eyebrow: "For a business",
      summary: "Current value",
      points: [{ title: "Benefit", detail: "Current detail" }],
      action: { label: "Begin", href: "/begin", detail: "Next action" },
    };
    const markdown = presentationSlideMarkdown(source)!;
    expect(markdown).toContain("# Revised offer");
    expect(markdown).toContain("## Benefit\n\nCurrent detail");
    expect(markdown).toContain("[Begin](/begin)\n\nNext action");
    const slides = renderableSlides();
    const content = {
      slides: [
        { ...sampleSlides()[0], lead: "Updated from YAML" },
        sampleSlides()[1],
      ],
    };
    expect(resolvePresentationSlideText(slides[0], 0, content)).toContain(
      "Updated from YAML",
    );
    expect(resolvePresentationSlideText(slides[1], 1, content)).not.toContain(
      "Updated from YAML",
    );
  });

  /** BDD Scenario: A custom startup supplies its own text format
   * Given a custom deck stores content outside a conventional slides array
   * When the renderer supplies explicit text or a formatter
   * Then the shared workspace uses that text and never substitutes another product
   */
  test("supports explicit custom text without guessing another source", () => {
    const slide = renderableSlides()[0];
    expect(
      resolvePresentationSlideText({ ...slide, text: "# Custom offer" }, 0, {}),
    ).toBe("# Custom offer");
    expect(
      resolvePresentationSlideText(slide, 0, {}, () => "# Custom formatter"),
    ).toBe("# Custom formatter");
    expect(
      resolvePresentationSlideText(slide, 0, {
        slides: [{ id: "different", title: "Unrelated" }],
      }),
    ).toBeUndefined();
  });

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

  /** BDD Scenario: Switching slides preserves complete export and current text
   * Given a startup deck has two slides and a single document confirmation
   * When the reviewer selects the second slide and switches between Layout and Text
   * Then PNG targets that slide, PDF retains both slides, and the text matches the selection
   */
  test("selects a slide independently of the full PDF deck", async () => {
    const dom = new JSDOM("<div id='root'></div>", {
      url: "http://localhost/?section=presentation",
    });
    const globals: Record<string, unknown> = {
      window: dom.window,
      document: dom.window.document,
      HTMLElement: dom.window.HTMLElement,
      ResizeObserver: class {
        observe() {}
        disconnect() {}
      },
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
    try {
      await act(async () =>
        root.render(
          createElement(PresentationWorkspace, {
            name: "Startup service",
            fileName: "startup-deck",
            content: { slides: sampleSlides() },
            confirmation: {
              confirmed: false,
              state: "unconfirmed",
              layer: "startup",
            },
            dataSourcePath: "products/startup/service/presentation/data.yaml",
            children: createElement(ProjectPresentation, {
              name: "Startup service",
              slides: renderableSlides(),
            }),
          }),
        ),
      );
      expect(host.textContent!.match(/Needs confirmation/g)).toHaveLength(1);
      const title = [...host.querySelectorAll("h2")].find(
        (heading) => heading.textContent === "Presentation",
      )!;
      expect(title.parentElement?.classList.contains("flex")).toBe(true);
      expect(title.parentElement?.textContent).toContain("Needs confirmation");
      expect(title.parentElement?.querySelectorAll("span")).toHaveLength(1);
      expect(host.querySelector("article")?.textContent).toContain(
        "Original offer copy",
      );
      const second = host.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Presentation slides"] button',
      )[1];
      await act(async () => second.click());
      expect(second.getAttribute("aria-current")).toBe("page");
      expect(host.querySelector("article")?.textContent).toContain(
        "A different slide",
      );
      const layout = [
        ...host.querySelectorAll<HTMLButtonElement>("button"),
      ].find((button) => button.textContent === "Layout")!;
      await act(async () => layout.click());
      expect(
        host
          .querySelector("[data-artifact-frame] [data-slide-id]")
          ?.getAttribute("data-slide-id"),
      ).toBe("value");
      expect(
        host
          .querySelector("[data-artifact-frame]")
          ?.getAttribute("data-export-width"),
      ).toBe("1600");
      expect(host.textContent).toContain("Download PNG");
      expect(
        host.querySelectorAll("[data-presentation-pdf-deck] [data-slide-id]"),
      ).toHaveLength(2);
      expect(
        host
          .querySelector("[data-presentation-pdf-deck]")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
      const text = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent === "Text",
      )!;
      await act(async () => text.click());
      expect(host.querySelector("article")?.textContent).toContain(
        "A different slide",
      );
      expect(
        host.querySelectorAll("[data-presentation-pdf-deck] [data-slide-id]"),
      ).toHaveLength(2);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const key of Object.keys(globals)) {
        if (previous[key])
          Object.defineProperty(globalThis, key, previous[key]!);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
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
      content: {},
      confirmation: {
        confirmed: false,
        state: "unconfirmed",
        layer: "startup",
      },
      dataSourcePath: "products/startup/course/presentation/data.yaml",
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
  expect(html.match(/>Prepare PDF</g)).toHaveLength(1);
  expect(html.match(/data-slide-id=/g)).toHaveLength(2);
  expect(html).toContain("local-offer");
  expect(html).toContain("startup");
  expect(html).not.toContain("Choose a slide");
  expect(html).not.toContain('aria-label="Presentation slides"');
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
