import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import CodeFrameworkPresentation, {
  presentationContent,
} from "./ProjectPresentation";

test("rendered slides resolve their surfaces and typography through semantic Design tokens", () => {
  const document = new JSDOM(
    renderToStaticMarkup(<CodeFrameworkPresentation />),
  ).window.document;
  const slides = document.querySelectorAll<HTMLElement>(
    "main[data-workspace-projection]",
  );
  expect(slides).toHaveLength(presentationContent.slides.length);
  for (const [index, slide] of [...slides].entries()) {
    const tone = presentationContent.slides[index].tone;
    const role =
      tone === "dark" ? "foreground" : tone === "accent" ? "accent" : "surface";
    // JSDOM does not resolve CSS custom properties; inspect the rendered declarations.
    const style = slide.getAttribute("style") ?? "";
    expect(style).toContain(
      `background-color:var(--workspace-brand-${role}, ${presentationContent.visual.palette[role]})`,
    );
    expect(style).toContain("font-family:var(--workspace-brand-font-body,");
    expect(slide.querySelector("[data-slide-content='true']")).not.toBeNull();
  }
});
