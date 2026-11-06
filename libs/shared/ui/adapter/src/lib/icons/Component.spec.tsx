import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "./Component";

it("renders a decorative, server-compatible Phosphor SVG with inherited color and CSS size overrides", () => {
  const html = renderToStaticMarkup(
    <Icon name="check" size={24} className="size-4 text-primary" />,
  );
  expect(html).toContain('data-icon-family="phosphor"');
  expect(html).toContain('data-icon-name="check"');
  expect(html).toContain('viewBox="0 0 256 256"');
  expect(html).toContain('fill="currentColor"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain("size-4");
  expect(html).not.toContain("h-6");
  expect(html).toContain("<path d=");
  expect(html).not.toContain("data-module=");
});
it("supports accessible labels and supplied SVG properties without interpreting SVG markup strings", () => {
  const html = renderToStaticMarkup(
    <Icon
      name="wallet"
      svgProps={{
        "aria-hidden": false,
        role: "img",
        "aria-label": "Purchases",
        stroke: "currentColor",
      }}
    />,
  );
  expect(html).toContain('role="img"');
  expect(html).toContain('aria-hidden="false"');
  expect(html).toContain('aria-label="Purchases"');
  expect(html).toContain('stroke="currentColor"');
});
