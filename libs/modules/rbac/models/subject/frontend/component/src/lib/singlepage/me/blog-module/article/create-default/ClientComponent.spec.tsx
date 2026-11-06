/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mutateAsync = jest.fn();
const reset = jest.fn();
const push = jest.fn();
const randomUUID = jest.fn();
const originalRandomUUID = Object.getOwnPropertyDescriptor(
  crypto,
  "randomUUID",
);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    blogModuleArticleCreate: () => ({ mutateAsync, reset, isPending: false }),
  },
}));
jest.mock("@sps/blog/models/category/sdk/client", () => ({
  api: {
    find: () => ({
      data: [{ id: "category-1", title: { en: "Frontend" } }],
      isError: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  articleCreateSchema: { parse: (value: unknown) => value },
}));

import { Component } from "./ClientComponent";

beforeAll(() =>
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: randomUUID,
  }),
);
afterAll(() => {
  if (originalRandomUUID)
    Object.defineProperty(crypto, "randomUUID", originalRandomUUID);
  else delete (crypto as any).randomUUID;
});
beforeEach(() => {
  jest.clearAllMocks();
  randomUUID
    .mockReset()
    .mockReturnValueOnce("first-request")
    .mockReturnValueOnce("corrected-request");
  mutateAsync.mockReset();
});

function openDraft() {
  render(
    <Component
      isServer={false}
      variant="me-blog-module-article-create-default"
      language="en"
      authenticated
      data={{ id: "subject-1" } as any}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title *"), {
    target: { value: "SPS readers" },
  });
  fireEvent.change(screen.getByLabelText("Summary *"), {
    target: { value: "How readers own their query." },
  });
  fireEvent.change(screen.getByLabelText("Article *"), {
    target: { value: "A complete article body." },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "category-1" },
  });
}

it("preserves a rejected draft, then uses a new request ID after an explicit edit", async () => {
  mutateAsync
    .mockRejectedValueOnce(
      Object.assign(new Error("Category is unavailable"), { status: 400 }),
    )
    .mockResolvedValueOnce({ article: { slug: "corrected-article" } });
  openDraft();
  fireEvent.click(screen.getByRole("button", { name: "Publish article" }));
  fireEvent.click(await screen.findByRole("button", { name: "Edit draft" }));
  expect((screen.getByRole("group") as HTMLFieldSetElement).disabled).toBe(
    false,
  );
  expect((screen.getByLabelText("Title *") as HTMLInputElement).value).toBe(
    "SPS readers",
  );
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish article" }));
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith("/en/blog/articles/corrected-article"),
  );
  expect(mutateAsync.mock.calls[0][0].data.requestId).toBe("first-request");
  expect(mutateAsync.mock.calls[1][0].data.requestId).toBe("corrected-request");
  expect(mutateAsync.mock.calls[1][0].data.categoryId).toBeUndefined();
});

it.each([undefined, 408, 429, 500])(
  "retries an uncertain outcome (%s) with its original immutable payload",
  async (status) => {
    mutateAsync.mockRejectedValue(
      Object.assign(
        new Error("Publication could not be confirmed"),
        status ? { status } : {},
      ),
    );
    openDraft();
    fireEvent.click(screen.getByRole("button", { name: "Publish article" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Edit draft" })).toBeNull();
    expect((screen.getByRole("group") as HTMLFieldSetElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry publication" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
    expect(mutateAsync.mock.calls[1][0].data).toEqual(
      mutateAsync.mock.calls[0][0].data,
    );
    expect(randomUUID).toHaveBeenCalledTimes(1);
  },
);

it("requires a nonblank summary before starting a publication attempt", () => {
  openDraft();
  fireEvent.change(screen.getByLabelText("Summary *"), {
    target: { value: "   " },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Publish article" }).closest("form")!,
  );
  expect(mutateAsync).not.toHaveBeenCalled();
  expect(randomUUID).not.toHaveBeenCalled();
});
