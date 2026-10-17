/** @jest-environment jsdom */
/**
 * BDD Suite: Source readers and editable notes.
 * Given: an SDK-loaded Source and unsaved human notes.
 * When: attachment analysis or removal refreshes the Source during editing.
 * Then: saving preserves the edited notes and the latest material analysis.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { Component as Source } from "@sps/knowledge/models/source/frontend/component";
import { Component as Form } from "../form-ai-chat";

const clientRead = jest.fn();
const serverRead = jest.fn();
import {
  assembleKnowledgeContent,
  readKnowledgeMaterials,
  readKnowledgeUserContext,
} from "@sps/shared-utils";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/knowledge/models/source/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { findById: (props: unknown) => clientRead(props) },
}));
jest.mock("@sps/knowledge/models/source/sdk/server", () => ({
  api: { findById: (props: unknown) => serverRead(props) },
}));
const stored = {
  id: "source",
  title: "Current title",
  content: "Saved content",
  className: "stored-source",
  contentHash: "hash",
  indexedContentHash: "hash",
};
const props: any = {
  isServer: false,
  variant: "id-ai-chat",
  data: { ...stored, title: "Stale title", content: "Stale content" },
  onSave: jest.fn(),
  onDiscuss: jest.fn(),
  className: "caller-class",
  apiProps: { options: { headers: { "X-Test": "record" } } },
};
async function resolveServer(element: ReactElement<any>) {
  while (typeof element.type === "function" && !element.props.clientApi)
    element = (element.type as Function)(element.props) as ReactElement<any>;
  const boundary = (element.type as Function)(
    element.props,
  ) as ReactElement<any>;
  const reader = boundary.props.children.props.children.props
    .children as ReactElement<any>;
  return await (reader.type as Function)(reader.props);
}
beforeEach(() => {
  clientRead.mockReset();
  serverRead.mockReset();
  props.onSave.mockReset();
});

it.each(["New file analysis", ""])(
  "preserves dirty notes while rebasing refreshed material content %s",
  async (materials) => {
    const before = {
      ...stored,
      content: assembleKnowledgeContent(
        "Saved notes",
        "Old analysis",
        "Old overview",
      ),
    };
    clientRead.mockReturnValue({ data: before, isLoading: false });
    const save = jest.fn().mockResolvedValue("Saved");
    const currentProps = { ...props, onSave: save };
    const view = render(<Source {...currentProps} />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Current title content" }),
      { target: { value: "Edited notes" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Knowledge section title" }),
      { target: { value: "Edited title" } },
    );
    const refreshed = assembleKnowledgeContent(
      "Saved notes",
      materials,
      "Current overview",
    );
    clientRead.mockReturnValue({
      data: { ...before, content: refreshed },
      isLoading: false,
    });
    view.rerender(<Source {...currentProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].title).toBe("Edited title");
    expect(readKnowledgeUserContext(save.mock.calls[0][0].content)).toBe(
      "Edited notes",
    );
    expect(readKnowledgeMaterials(save.mock.calls[0][0].content)).toBe(
      readKnowledgeMaterials(refreshed),
    );
    expect(save.mock.calls[0][0].content).not.toContain("Old analysis");
  },
);

it("saves dirty notes before uploading attachments for analysis", async () => {
  clientRead.mockReturnValue({ data: stored, isLoading: false });
  const save = jest.fn().mockResolvedValue("Saved");
  const attach = jest.fn().mockResolvedValue("Files saved");
  render(<Source {...props} onSave={save} onAttach={attach} />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Current title content" }),
    { target: { value: "Notes for the uploaded file" } },
  );
  fireEvent.change(screen.getByLabelText("Upload files for Current title"), {
    target: {
      files: [new File(["Material"], "material.txt", { type: "text/plain" })],
    },
  });
  await waitFor(() => expect(attach).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ content: "Notes for the uploaded file" }),
  );
  expect(save.mock.invocationCallOrder[0]).toBeLessThan(
    attach.mock.invocationCallOrder[0],
  );
});
it("reads the current Source by ID and preserves its scoped save callback and caller props", async () => {
  clientRead.mockReturnValue({ data: stored, isLoading: false });
  props.onSave.mockResolvedValue("Saved");
  render(<Source {...props} />);
  expect(clientRead).toHaveBeenCalledWith({ id: "source", ...props.apiProps });
  expect(serverRead).not.toHaveBeenCalled();
  expect(
    (
      screen.getByRole("textbox", {
        name: "Current title content",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("Saved content");
  expect(
    document.querySelector('article[data-id="source"]')?.className,
  ).toContain("stored-source");
  fireEvent.change(
    screen.getByRole("textbox", { name: "Current title content" }),
    { target: { value: "Edited content" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() =>
    expect(props.onSave).toHaveBeenCalledWith({
      title: "Current title",
      content: "Edited content",
    }),
  );
});
it("does not render a stale Source while the SDK is loading", () => {
  clientRead.mockReturnValue({ data: undefined, isLoading: true });
  render(<Source {...props} />);
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Save knowledge" })).toBeNull();
});
it("loads the Source on the server without calling the client reader", async () => {
  serverRead.mockResolvedValue(stored);
  render(
    await resolveServer(
      Source({ ...props, isServer: true }) as ReactElement<any>,
    ),
  );
  expect(serverRead).toHaveBeenCalledWith({ id: "source", ...props.apiProps });
  expect(clientRead).not.toHaveBeenCalled();
  expect(
    (
      screen.getByRole("textbox", {
        name: "Knowledge section title",
      }) as HTMLInputElement
    ).value,
  ).toBe("Current title");
});
it.each([false])(
  "creates a draft without a Source ID or record lookup (server=%s)",
  async (isServer) => {
    const save = jest.fn().mockResolvedValue("Created");
    const creation: any = {
      isServer,
      variant: "form-ai-chat",
      title: "Brief",
      placeholder: "Describe your project",
      onSave: save,
    };
    render(
      isServer ? (
        await resolveServer(Form(creation) as ReactElement<any>)
      ) : (
        <Form {...creation} />
      ),
    );
    expect(clientRead).not.toHaveBeenCalled();
    expect(serverRead).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Brief content" }), {
      target: { value: "New draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        title: "Brief",
        content: "New draft",
      }),
    );
  },
);
