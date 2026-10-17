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
jest.mock("@sps/shared-frontend-client-utils", () => ({
  getLocalizedHref: (locale: string, href: string) =>
    `${locale}${href === "/" ? "" : href}`,
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-logotypes/frontend/component",
  () => ({ Component: () => null }),
);

it.each([
  ["Help", "/ru/ai-chat/help", "navbar"],
  ["Sign in", "/ru/ai-chat/sign-in", "navbar"],
  ["SPS AI Chat home", "/ru", "brand"],
  ["Start with my files", "/ru/ai-chat/projects", "footer"],
  ["Sign in", "/ru/ai-chat/sign-in", "footer"],
  ["Code Framework", "/ru/framework", "footer"],
])("routes %s through Next (%s, %s)", (name, href, surface) => {
  const router = { push: jest.fn(), prefetch: jest.fn() };
  const props = {
    isServer: false,
    data: { id: "widget" },
    language: "ru",
  } as any;
  render(
    <RouterContext.Provider value={router as any}>
      {surface === "brand" ? (
        <Brand {...props} />
      ) : surface === "footer" ? (
        <Footer {...props} />
      ) : (
        <Navbar {...props} />
      )}
    </RouterContext.Provider>,
  );
  const link = screen.getByRole("link", { name, exact: true });
  expect(link.getAttribute("href")).toBe(href);
  expect(fireEvent.click(link)).toBe(false);
  expect(router.push).toHaveBeenCalledWith(href, expect.any(Object));
});
