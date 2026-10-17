/** @jest-environment jsdom */
import { render } from "@testing-library/react";
const widgetSpy = jest.fn();
const segmentSpy = jest.fn();
const values: Record<string, string | undefined> = {};
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: (props: any) => {
    segmentSpy(props.segment, props.url, props.isServer);
    return props.children({ data: values[props.segment] });
  },
}));
jest.mock("@sps/rbac/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    widgetSpy(props);
    return <div />;
  },
}));
import { Component as Workspace } from "./Component";
import { Component as CreateThread } from "../subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/Component";
import { Component as Settings } from "../subject-me-social-module-profile-id-settings-ai-chat/Component";
describe("Host route context for AI Chat widgets", () => {
  beforeEach(() => {
    widgetSpy.mockReset();
    segmentSpy.mockReset();
    Object.assign(values, {
      "social.profiles.id": "profile-from-db-mask",
      "social.chats.id": "chat-from-db-mask",
      "social.threads.id": "thread-from-db-mask",
    });
  });
  it.each([
    [
      Workspace,
      "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
      true,
    ],
    [
      CreateThread,
      "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat",
      false,
    ],
    [Settings, "subject-me-social-module-profile-id-settings-ai-chat", false],
  ])(
    "resolves %s from the Host provider without forwarding relation filters",
    (Screen, variant, hasThread) => {
      const url = "/a/page/whose/parameters/come/from/the/database";
      const data = { id: "rbac-widget" };
      render(
        <Screen
          {...({
            isServer: true,
            language: "ru",
            url,
            variant,
            data,
            apiProps: {
              params: {
                filters: {
                  and: [
                    { column: "widgetId", method: "eq", value: "host-widget" },
                  ],
                },
              },
            },
          } as any)}
        />,
      );
      expect(widgetSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isServer: true,
          language: "ru",
          data,
          profileId: "profile-from-db-mask",
          chatId: "chat-from-db-mask",
        }),
      );
      expect(widgetSpy.mock.calls[0][0]).not.toHaveProperty("apiProps");
      expect(widgetSpy.mock.calls[0][0]).not.toHaveProperty("url");
      expect(widgetSpy.mock.calls[0][0].threadId).toBe(
        hasThread ? "thread-from-db-mask" : undefined,
      );
      expect(segmentSpy).toHaveBeenCalledWith("social.profiles.id", url, true);
      expect(segmentSpy).toHaveBeenCalledWith("social.chats.id", url, true);
    },
  );
});
