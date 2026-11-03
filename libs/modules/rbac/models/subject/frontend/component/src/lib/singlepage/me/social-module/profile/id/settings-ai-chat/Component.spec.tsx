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
jest.mock("../chat/id/thread/id/ai-chat/utils", () => ({
  getProjectsQueryKey: (id: string) => ["projects", id],
}));
import { Component } from "./Component";

it.each(["en", "ru"])(
  "renames the selected %s title while preserving other locales",
  async (language) => {
    jest.clearAllMocks();
    save.mockResolvedValue({ id: "project" });
    invalidateQueries.mockResolvedValue(undefined);
    render(
      <Component
        {...({
          isServer: false,
          language,
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
    fireEvent.change(
      screen.getByRole("textbox", {
        name: language === "ru" ? "Название проекта" : "Project name",
      }),
      {
        target: { value: "New name" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: language === "ru" ? "Сохранить название" : "Save name",
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith({
      id: "subject",
      socialModuleProfileId: "requester",
      socialModuleChatId: "chat",
      targetSocialModuleProfileId: "project",
      data: {
        adminTitle: "New name",
        title: { en: "Old name", ru: "Имя", [language]: "New name" },
      },
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["projects", "subject"],
    });
    expect(screen.getByRole("status").textContent).toBe(
      language === "ru" ? "Название проекта сохранено" : "Project name saved",
    );
  },
);
