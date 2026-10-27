/** @jest-environment jsdom */
jest.mock("client-only", () => ({}), { virtual: true });
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const removeFile = jest.fn();
const attachments = Array.from({ length: 13 }, (_, index) => ({
  relation: { id: `relation-${index}` },
  file: {
    id: `file-${index}`,
    adminTitle: `Reference ${index}`,
    file: `/${index}.png`,
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate:
      () => ({ mutateAsync: jest.fn() }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate:
      () => ({ mutateAsync: removeFile }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind:
      () => ({ data: attachments }),
  },
}));
jest.mock("@sps/knowledge/models/source/frontend/component", () => ({
  Component: ({ attachments }: any) => <article>{attachments}</article>,
}));
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: ({ data }: any) => <a href={data.file}>{data.adminTitle}</a>,
}));
import Component from "./client";
const props = {
  language: "en",
  data: { id: "subject" },
  project: {
    requesterProfileId: "requester",
    profile: { id: "assistant" },
    chat: { id: "chat" },
  },
  source: { id: "source", contentHash: "current-hash" },
  onDiscuss: jest.fn(),
} as any;
beforeEach(() => removeFile.mockReset());
it("shows two file cards and expands the remaining files vertically", () => {
  render(<Component {...props} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Show more" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(13);
  expect(
    screen.getByRole("link", { name: "Reference 12" }).getAttribute("href"),
  ).toBe("/12.png");
  fireEvent.click(screen.getByRole("button", { name: "Show less" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});
it("unlinks the selected file with the current Source hash and scopes pending state to that card", async () => {
  let finish: (value: any) => void = () => {};
  removeFile.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<Component {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove Reference 0 from knowledge" }),
  );
  expect(removeFile).toHaveBeenCalledWith({
    id: "subject",
    socialModuleProfileId: "requester",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "assistant",
    knowledgeModuleSourceId: "source",
    data: { removeFileId: "file-0", expectedContentHash: "current-hash" },
  });
  expect(
    (
      screen.getByRole("button", {
        name: "Remove Reference 0 from knowledge",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    (
      screen.getByRole("button", {
        name: "Remove Reference 1 from knowledge",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  finish({ processingError: "Analysis unavailable" });
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "File removed; analysis failed: Analysis unavailable",
    ),
  );
});
it("reports a failed removal and keeps the cards available", async () => {
  removeFile.mockRejectedValue(new Error("Conflict: Source changed"));
  render(<Component {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove Reference 1 from knowledge" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe(
      "Conflict: Source changed",
    ),
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

it("returns control after detachment and clears its analysis notice when the Source index updates", async () => {
  removeFile.mockResolvedValue({ analysisPending: true });
  const rendered = render(
    <Component
      {...props}
      source={{ ...props.source, indexedContentHash: null }}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Remove Reference 0 from knowledge" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "Analyzing remaining files",
    ),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Remove Reference 0 from knowledge",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  rendered.rerender(
    <Component
      {...props}
      source={{ ...props.source, indexedContentHash: props.source.contentHash }}
    />,
  );
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
});
