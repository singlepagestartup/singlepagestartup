/** @jest-environment jsdom */
jest.mock("client-only", () => ({}), { virtual: true });
import { fireEvent, render, screen } from "@testing-library/react";
const skills = jest.fn((_props: any) => ({
  data: [{ id: "skill", title: "Knowledge editing" }],
}));
const sources = jest.fn((_props: any) => ({
  data: [
    { id: "products", title: "Products" },
    { id: "bookings", title: "Bookings" },
    { id: "brief", title: "Business brief" },
  ],
}));
const files = jest.fn((_props: any) => ({
  data: [{ file: { id: "file", adminTitle: "workshop.txt" } }],
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFind: () => ({
      data: [
        {
          id: "assistant",
          variant: "artificial-intelligence",
          title: { en: "Project assistant" },
        },
      ],
    }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind: (
      props: any,
    ) => skills(props),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind: (
      props: any,
    ) => sources(props),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind:
      (props: any) => files(props),
  },
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: (props: any) => (
    <aside aria-label="Assistant profile">
      <h2>{props.data.title.en}</h2>
      <p>Skills · {props.skillsCount}</p>
      {props.skills}
      <p>Knowledge · {props.knowledgeCount}</p>
      {props.children}
      <button onClick={props.onClose}>Close agent profile</button>
    </aside>
  ),
}));
jest.mock("@sps/social/models/skill/frontend/component", () => ({
  Component: (props: any) => <h3>{props.data.title}</h3>,
}));
jest.mock("@sps/knowledge/models/source/frontend/component", () => ({
  Component: (props: any) => (
    <article>
      {props.data.title}
      {props.children}
    </article>
  ),
}));
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: (props: any) => <p>{props.data.adminTitle}</p>,
}));
import Component from "./client";
it("shows all Knowledge and Skills of the selected Chat profile through owner-scoped SDKs", () => {
  const close = jest.fn();
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        profileId: "assistant",
        onClose: close,
      } as any)}
    />,
  );
  expect(screen.getByText("Skills · 1")).toBeTruthy();
  expect(screen.getByText("Knowledge · 3")).toBeTruthy();
  for (const name of [
    "Knowledge editing",
    "Products",
    "Bookings",
    "Business brief",
  ])
    expect(screen.getByText(name)).toBeTruthy();
  const scope = expect.objectContaining({
    id: "subject",
    socialModuleProfileId: "requester",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "assistant",
  });
  expect(skills).toHaveBeenCalledWith(scope);
  expect(sources).toHaveBeenCalledWith(scope);
  expect(files).toHaveBeenCalledWith(
    expect.objectContaining({
      targetSocialModuleProfileId: "assistant",
      knowledgeModuleSourceId: "bookings",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Close agent profile" }));
  expect(close).toHaveBeenCalled();
});
