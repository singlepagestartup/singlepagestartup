/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: knowledge admin-v2 overview rendering.
 *
 * Given: overview receives module and model admin routes.
 * When: user opens search, document, source, chunk, edit suggestion, or another module route.
 * Then: knowledge admin-v2 renders only the matching route content.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

function queryByTestId(container: HTMLDivElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`);
}

jest.mock("./search", () => ({
  Component: () => <div data-testid="knowledge-search" />,
}));

jest.mock("./source/Component", () => ({
  Component: () => <div data-testid="knowledge-source" />,
}));

jest.mock("./document/Component", () => ({
  Component: () => <div data-testid="knowledge-document" />,
}));

jest.mock("./chunk/Component", () => ({
  Component: () => <div data-testid="knowledge-chunk" />,
}));

jest.mock("./edit-suggestion/Component", () => ({
  Component: () => <div data-testid="knowledge-edit-suggestion" />,
}));

describe("GIVEN: knowledge admin-v2 overview is mounted", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  /**
   * BDD Scenario: renders knowledge search at the module root.
   *
   * Given: the current route is the knowledge module root.
   * When: the overview component renders.
   * Then: search is visible and model pages stay hidden.
   */
  test("renders search at the knowledge module root", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/knowledge" />);
    });

    expect(queryByTestId(container, "knowledge-search")).not.toBeNull();
    expect(queryByTestId(container, "knowledge-document")).toBeNull();
    expect(queryByTestId(container, "knowledge-source")).toBeNull();
    expect(queryByTestId(container, "knowledge-chunk")).toBeNull();
    expect(queryByTestId(container, "knowledge-edit-suggestion")).toBeNull();
  });

  /**
   * BDD Scenario: renders document page for the document route.
   *
   * Given: the current route targets knowledge document.
   * When: the overview component renders.
   * Then: document content is visible and other pages stay hidden.
   */
  test("renders document content for the document route", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/knowledge/document" />,
      );
    });

    expect(queryByTestId(container, "knowledge-document")).not.toBeNull();
    expect(queryByTestId(container, "knowledge-search")).toBeNull();
    expect(queryByTestId(container, "knowledge-source")).toBeNull();
    expect(queryByTestId(container, "knowledge-chunk")).toBeNull();
  });

  /**
   * BDD Scenario: renders source page for the source route.
   *
   * Given: the current route targets knowledge source.
   * When: the overview component renders.
   * Then: source content is visible and other pages stay hidden.
   */
  test("renders source content for the source route", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/knowledge/source" />);
    });

    expect(queryByTestId(container, "knowledge-source")).not.toBeNull();
    expect(queryByTestId(container, "knowledge-search")).toBeNull();
    expect(queryByTestId(container, "knowledge-document")).toBeNull();
    expect(queryByTestId(container, "knowledge-chunk")).toBeNull();
  });

  /**
   * BDD Scenario: renders chunk page for the chunk route.
   *
   * Given: the current route targets knowledge chunk.
   * When: the overview component renders.
   * Then: chunk content is visible and other pages stay hidden.
   */
  test("renders chunk content for the chunk route", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/knowledge/chunk" />);
    });

    expect(queryByTestId(container, "knowledge-chunk")).not.toBeNull();
    expect(queryByTestId(container, "knowledge-search")).toBeNull();
    expect(queryByTestId(container, "knowledge-document")).toBeNull();
    expect(queryByTestId(container, "knowledge-source")).toBeNull();
  });

  /**
   * BDD Scenario: renders edit suggestions for the edit suggestion route.
   *
   * Given: the current route targets knowledge edit suggestions.
   * When: the overview component renders.
   * Then: edit suggestion content is visible and other pages stay hidden.
   */
  test("renders edit suggestion content for the edit suggestion route", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/knowledge/edit-suggestion" />,
      );
    });

    expect(
      queryByTestId(container, "knowledge-edit-suggestion"),
    ).not.toBeNull();
    expect(queryByTestId(container, "knowledge-search")).toBeNull();
    expect(queryByTestId(container, "knowledge-source")).toBeNull();
    expect(queryByTestId(container, "knowledge-chunk")).toBeNull();
  });

  /**
   * BDD Scenario: rejects routes from other modules.
   *
   * Given: the current route belongs to another module.
   * When: the knowledge overview renders.
   * Then: no overview content is produced.
   */
  test("returns null for routes outside knowledge", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/ecommerce" />);
    });

    expect(container.firstChild).toBeNull();
  });
});
