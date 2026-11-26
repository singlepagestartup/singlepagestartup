/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KnowledgeSourceFiles } from "./KnowledgeSourceFiles";

const mutateAsync = jest.fn();
jest.mock(
  "@sps/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find",
  () => ({
    action: () => ({
      data: [{ file: { id: "file", adminTitle: "Products.pdf" } }],
      refetch: jest.fn(),
    }),
  }),
);
jest.mock(
  "@sps/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/update",
  () => ({ action: () => ({ mutateAsync, isPending: false }) }),
);

it("changes attachments within the knowledge form without submitting the text draft", async () => {
  const user = userEvent.setup();
  const scope = {
    id: "operator",
    socialModuleProfileId: "profile",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "assistant",
    knowledgeModuleSourceId: "source",
  };
  const onSubmit = jest.fn((event) => event.preventDefault());
  const remove = jest.fn();
  const form = (removedIds: string[], disabled = false) => (
    <form onSubmit={onSubmit}>
      <KnowledgeSourceFiles
        scope={scope}
        language="en"
        onRemove={remove}
        removedIds={removedIds}
        disabled={disabled}
      />
    </form>
  );
  const { rerender } = render(form([]));
  await user.click(screen.getByRole("button", { name: "Detach Products.pdf" }));
  expect(remove).toHaveBeenCalledWith("file");
  expect(mutateAsync).not.toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
  rerender(form(["file"]));
  expect(screen.queryByText("Products.pdf")).toBeNull();
  rerender(form([], true));
  expect(
    screen.getByRole("button", { name: "Detach Products.pdf" }),
  ).toHaveProperty("disabled", true);
  expect(screen.queryByRole("button", { name: /Analyze|Replace/ })).toBeNull();
});
