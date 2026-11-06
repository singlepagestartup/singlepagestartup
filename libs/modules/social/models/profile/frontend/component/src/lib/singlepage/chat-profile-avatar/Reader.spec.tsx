import { renderToStaticMarkup } from "react-dom/server";

jest.mock("server-only", () => ({}));
jest.mock("client-only", () => ({}));
const mockRelations = jest.fn();
const mockFiles = jest.fn();
jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: any) => {
      mockRelations(props);
      return props.children({
        data: [{ id: "link", fileStorageModuleFileId: "avatar" }],
      });
    },
  }),
);
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: (props: any) => {
    mockFiles(props);
    return props.children({ data: [] });
  },
}));

import { Component } from "../../index";

it("keeps avatar relation readers in the client subtree even when composed by a server parent", () => {
  const html = renderToStaticMarkup(
    <Component
      variant="chat-profile-avatar"
      isServer={true}
      language="en"
      data={{ id: "profile", title: { en: "Jane" } } as any}
    />,
  );
  expect(html).toContain("J");
  expect(mockRelations).toHaveBeenCalledWith(
    expect.objectContaining({ isServer: false, variant: "find" }),
  );
  expect(mockFiles).toHaveBeenCalledWith(
    expect.objectContaining({ isServer: false, variant: "find" }),
  );
});

it("uses a supplied scoped File result without querying global relation lists", () => {
  mockRelations.mockClear();
  mockFiles.mockClear();
  const html = renderToStaticMarkup(
    <Component
      variant="chat-profile-avatar"
      isServer={true}
      language="en"
      data={{ id: "profile", title: { en: "Jane" } } as any}
      file={null}
      fallback={<span>No avatar</span>}
    />,
  );
  expect(html).toContain("No avatar");
  expect(mockRelations).not.toHaveBeenCalled();
  expect(mockFiles).not.toHaveBeenCalled();
});
