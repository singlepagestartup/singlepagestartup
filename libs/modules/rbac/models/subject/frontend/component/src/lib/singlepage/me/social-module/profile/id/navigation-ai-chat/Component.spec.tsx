/** @jest-environment jsdom */
jest.mock("client-only", () => ({}), { virtual: true });
import { render, screen } from "@testing-library/react";
const records = [
  ...["products", "design", "brief", "brand", "strategy"].map((key) => ({
    id: key,
    title: `${key}.md`,
    metadata: { aiChatDocument: { key, profileId: "project", sourceIds: [] } },
  })),
  {
    id: "topic",
    title: "Bookings discussion",
    metadata: { aiChatDocument: { profileId: "project", sourceIds: [] } },
  },
  {
    id: "foreign",
    title: "Other project's brief",
    metadata: {
      aiChatDocument: {
        key: "brief",
        profileId: "other-project",
        sourceIds: [],
      },
    },
  },
];
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: { socialModuleChatFindByIdThreadFind: () => ({ data: records }) },
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: (props: any) =>
    props.documents ? (
      <div data-testid="documents">
        {props.documents.map((document: any) => (
          <a key={document.data.id}>{document.data.title}</a>
        ))}
      </div>
    ) : (
      <>
        {props.children}
        <div data-testid="topics">{props.threads}</div>
      </>
    ),
}));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: (props: any) => <a href={props.href}>{props.data.title}</a>,
}));
import Component from "./client";
it("lists accessible threads in their supplied order regardless of document metadata", () => {
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          profile: { id: "project" },
          chat: { id: "chat" },
          thread: { id: "brief" },
        },
      } as any)}
    />,
  );
  expect(screen.queryByTestId("documents")).toBeNull();
  expect(screen.getAllByRole("link").map((row) => row.textContent)).toEqual(
    records.map((thread) => thread.title),
  );
});
