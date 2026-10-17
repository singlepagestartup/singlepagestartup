/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const save = jest.fn();
const refresh = jest.fn();
const invalidateQueries = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate: () => ({
      mutateAsync: save,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: { invalidateQueries },
}));
jest.mock(
  "../me-social-module-profile-id-chat-id-thread-id-ai-chat/utils",
  () => ({
    getProjectsQueryKey: (id: string) => ["projects", id],
  }),
);
import { Component } from "./Component";

it("refreshes the server composition after a scoped rename and preserves other locales", async () => {
  save.mockResolvedValue({ id: "project" });
  invalidateQueries.mockResolvedValue(undefined);
  render(
    <Component
      {...({
        isServer: false,
        variant: "me-social-module-profile-id-settings-ai-chat",
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project", title: { en: "Old name", ru: "Имя" } },
          chat: { id: "chat" },
        },
      } as any)}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Project name" }), {
    target: { value: "New name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save name" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenCalledWith({
    id: "subject",
    socialModuleProfileId: "requester",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "project",
    data: { adminTitle: "New name", title: { en: "New name", ru: "Имя" } },
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["projects", "subject"],
  });
  expect(screen.getByRole("status").textContent).toBe("Project name saved");
});
