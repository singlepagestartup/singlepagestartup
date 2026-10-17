/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";
it("shows an ordinary thread as a full-width conversation without document controls or Knowledge", () => {
  render(
    <Component
      {...({
        data: { id: "topic", title: "Pickup and booking checks" },
        isDocument: false,
        messages: <p>Conversation</p>,
        composer: <p>Message form</p>,
        knowledge: <p>Knowledge</p>,
        documentDownload: <button>Export</button>,
      } as any)}
    />,
  );
  expect(screen.queryByRole("region", { name: /editor/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Document" })).toBeNull();
  expect(screen.queryByText("Knowledge")).toBeNull();
  expect(screen.queryByText("Export")).toBeNull();
  expect(screen.getByText("Conversation")).toBeTruthy();
  expect(screen.getByText("Message form")).toBeTruthy();
});
it("keeps Knowledge and export in the document pane for a predefined document", () => {
  render(
    <Component
      {...({
        data: { id: "brief", title: "Brief.md" },
        isDocument: true,
        messages: null,
        composer: null,
        knowledge: <p>Brief knowledge</p>,
        documentDownload: <button>Export</button>,
      } as any)}
    />,
  );
  expect(screen.getByRole("region", { name: "Brief.md editor" })).toBeTruthy();
  expect(screen.getByText("Brief knowledge")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
});
