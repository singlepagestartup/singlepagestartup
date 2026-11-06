/** @jest-environment jsdom */
/**
 * BDD Suite: AI Chat internal navigation uses Next routing.
 * Given: the shared header, footer and brand inside the Next router context.
 * When: a visitor follows Help, home, project or sign-in links.
 * Then: Next handles navigation without allowing a document navigation.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { Component as Navbar } from "./Component";
import { Component as Footer } from "../footer-ai-chat/Component";
import { Component as Brand } from "../../../../../../../logotype/frontend/component/src/lib/singlepage/brand-ai-chat/Component";

jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));
jest.mock(
  "@sps/website-builder/relations/logotypes-to-file-storage-module-files/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...items: any[]) => items.filter(Boolean).join(" "),
  getLocalizedHref: (locale: string, href: string) =>
    `${locale}${href === "/" ? "" : href}`,
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-logotypes/frontend/component",
  () => ({ Component: () => null }),
);

jest.mock(
  "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component",
  () => ({
    Component: (props: any) =>
      props.variant === "find" ? (
        props.children({
          data: [{ id: "saved-link", buttonsArrayId: "saved-array" }],
        })
      ) : (
        <a href="/ru/custom-route">Сохранённая ссылка</a>
      ),
  }),
);
it.each([Navbar, Footer])(
  "renders a saved ButtonsArray without fallback links",
  (Component) => {
    render(
      <Component
        isServer={false}
        language="ru"
        data={{ id: "widget" } as any}
        children={<button>Аккаунт</button>}
      />,
    );
    expect(
      screen
        .getByRole("link", { name: "Сохранённая ссылка" })
        .getAttribute("href"),
    ).toBe("/ru/custom-route");
    expect(screen.queryByRole("link", { name: "Помощь" })).toBeNull();
  },
);
it("routes the brand home link through Next", () => {
  const router = { push: jest.fn(), prefetch: jest.fn() };
  render(
    <RouterContext.Provider value={router as any}>
      <Brand
        isServer={false}
        variant="brand-ai-chat"
        data={
          {
            id: "brand",
            url: "/",
            title: { ru: "AI Chat — главная страница" },
          } as any
        }
        language="ru"
      />
    </RouterContext.Provider>,
  );
  const link = screen.getByRole("link", { name: "AI Chat — главная страница" });
  expect(link.getAttribute("href")).toBe("/ru");
  expect(fireEvent.click(link)).toBe(false);
});
