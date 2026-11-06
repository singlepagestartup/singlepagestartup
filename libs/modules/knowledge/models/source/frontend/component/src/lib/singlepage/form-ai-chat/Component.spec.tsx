/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  assembleKnowledgeContent,
  readKnowledgeMaterials,
  readKnowledgeUserContext,
} from "@sps/shared-utils";
import { Component } from "./ClientComponent";

it("edits confirmed notes without exposing delimiters or overwriting file analysis", async () => {
  const content = assembleKnowledgeContent(
    "# Project brief\nConfirmed facts",
    "Two attached logos",
    "Project overview",
  );
  const onSave = jest.fn().mockResolvedValue("Saved");
  render(
    <Component
      language="en"
      {...({
        isServer: false,
        variant: "id-ai-chat",
        data: {
          id: "source",
          title: "Brief",
          content,
          contentHash: "hash",
          indexedContentHash: "hash",
        },
        onSave,
      } as any)}
    />,
  );
  const editor = screen.getByRole("textbox", { name: "Brief content" });
  expect((editor as HTMLTextAreaElement).value).toBe(
    "# Project brief\nConfirmed facts",
  );
  fireEvent.change(editor, {
    target: { value: "# Project brief\nUpdated facts" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  expect(screen.getByRole("heading", { name: "Project brief" })).toBeTruthy();
  expect(screen.getByText("Two attached logos")).toBeTruthy();
  expect(screen.getByText("Project overview")).toBeTruthy();
  expect(document.body.textContent).not.toContain("knowledge:user");
  expect(document.body.textContent).not.toContain("Контекст пользователя");
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  const saved = onSave.mock.calls[0][0];
  expect(readKnowledgeUserContext(saved.content)).toBe(
    "# Project brief\nUpdated facts",
  );
  expect(readKnowledgeMaterials(saved.content)).toBe(
    readKnowledgeMaterials(content),
  );
});
