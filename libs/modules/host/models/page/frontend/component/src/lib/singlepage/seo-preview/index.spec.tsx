/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { api } from "@sps/host/models/page/sdk/client";
import type { IInsertSchema } from "@sps/host/models/metadata/sdk/model";

const refetch = jest.fn();
jest.mock("@sps/host/models/page/sdk/client", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  api: { previewSeo: jest.fn() },
}));
jest.mock("../variants", () => ({
  variants: { "seo-preview": jest.requireActual("./index").Component },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    defaultLanguage: { code: "ru" },
    languages: [
      { code: "ru", title: "Russian" },
      { code: "en", title: "English" },
    ],
  },
}));
function Editor() {
  const form = useForm<IInsertSchema>({
    defaultValues: { title: "Saved title" },
  });
  return (
    <>
      <input aria-label="Metadata title" {...form.register("title")} />
      <Page
        isServer={false}
        variant="seo-preview"
        control={form.control}
        metadataId="existing-metadata"
      />
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(api.previewSeo).mockReturnValue({
    data: undefined,
    isFetching: false,
    error: null,
    refetch,
  } as any);
});
it("passes unsaved Metadata values through the Page reader and previews the selected URL", () => {
  render(<Editor />);
  fireEvent.change(screen.getByLabelText("Metadata title"), {
    target: { value: "[blog.articles.title]" },
  });
  fireEvent.change(screen.getByLabelText("Page URL"), {
    target: { value: "/ru/blog/articles/framework-blog" },
  });
  expect(api.previewSeo).toHaveBeenLastCalledWith({
    url: "/ru/blog/articles/framework-blog",
    metadata: { title: "[blog.articles.title]", id: "existing-metadata" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview draft" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
it("renders the Page SDK result and its publication policy", () => {
  jest.mocked(api.previewSeo).mockReturnValue({
    data: {
      metadata: {
        title: "Framework guide",
        description: "Server rendering",
        robots: { index: false },
        alternates: { canonical: "https://example.com/ru/framework" },
      },
      structuredData: [],
    },
    isFetching: false,
    error: null,
    refetch,
  } as any);
  render(<Editor />);
  expect(screen.getByRole("heading", { name: "Framework guide" })).toBeTruthy();
  expect(screen.getByText("Indexing: noindex")).toBeTruthy();
  expect(
    screen.getByText("Canonical: https://example.com/ru/framework"),
  ).toBeTruthy();
});

it("takes an explicit English URL into the preview and sends no language field", () => {
  render(<Editor />);
  fireEvent.change(screen.getByLabelText("Page URL"), {
    target: { value: "/en/about" },
  });
  expect(api.previewSeo).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: "/en/about" }),
  );
  expect(jest.mocked(api.previewSeo).mock.calls.at(-1)![0]).not.toHaveProperty(
    "language",
  );
  fireEvent.change(screen.getByLabelText("Language"), {
    target: { value: "ru" },
  });
  expect((screen.getByLabelText("Page URL") as HTMLInputElement).value).toBe(
    "/ru/about",
  );
  expect(api.previewSeo).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: "/ru/about" }),
  );
});
