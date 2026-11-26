/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { ServiceCard } from "./ServiceCard";

jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: jest.requireActual(
    "../../../../../../../../../../shared/ui/shadcn/src/lib/tiptap/content",
  ).TipTapContent,
}));

const href = "/ru/framework/services/framework-business-brief";

it("provides one stretched service link with a focus indicator", () => {
  render(
    <ul>
      <ServiceCard
        title="Бриф бизнеса"
        summary="Бриф с целями и ограничениями."
        href={href}
        language="ru"
        price={<span>2×</span>}
      />
    </ul>,
  );

  const card = screen.getByRole("article");
  const link = within(card).getByRole("link", {
    name: "Подробнее об услуге «Бриф бизнеса»",
  });
  expect(within(card).getAllByRole("link")).toEqual([link]);
  expect(link).toHaveAttribute("href", href);
  expect(link).not.toHaveAttribute("target");
  expect(link).toHaveClass(
    "after:absolute",
    "after:inset-0",
    "focus-visible:after:outline-2",
  );
  link.focus();
  expect(link).toHaveFocus();
});

it("keeps a rich summary link and its price controls outside the service link", () => {
  render(
    <ul>
      <ServiceCard
        title="Business brief"
        summary={JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Read the " },
                {
                  type: "text",
                  text: "guidelines",
                  marks: [{ type: "link", attrs: { href: "/reference" } }],
                },
              ],
            },
          ],
        })}
        href={href}
        language="en"
        price={<button type="button">Rates</button>}
      />
    </ul>,
  );

  const service = screen.getByRole("link", {
    name: "Learn about Business brief",
  });
  expect(screen.getByRole("link", { name: "guidelines" })).toHaveAttribute(
    "href",
    "/reference",
  );
  expect(service).not.toContainElement(
    screen.getByRole("link", { name: "guidelines" }),
  );
  expect(service).not.toContainElement(
    screen.getByRole("button", { name: "Rates" }),
  );
});
