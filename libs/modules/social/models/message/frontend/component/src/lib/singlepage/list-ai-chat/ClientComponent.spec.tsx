/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { replaceEqualDeep } from "@tanstack/react-query";
import { Component } from "./ClientComponent";

const mockRows = jest.fn();
jest.mock("markdown-to-jsx", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    mockRows(children);
    return <p>{children}</p>;
  },
}));
jest.mock(
  "@sps/social/relations/profiles-to-messages/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock(
  "@sps/social/relations/messages-to-file-storage-module-files/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  useChatScroll: () => ({
    list: { current: null },
    hasNew: false,
    followLatest: () => {},
  }),
}));

it.each([100, 1000])(
  "preserves unchanged production message rows across refetch/edit/append with %i messages",
  (count) => {
    const data = Array.from({ length: count }, (_, i) => ({
      id: String(i),
      createdAt: "2026-10-16T00:00:00Z",
      description: `message ${i}`,
      authorProfileIds: ["owner"],
      attachments: [],
    }));
    const props: any = {
      isServer: false,
      variant: "list-ai-chat",
      data,
      requesterProfileId: "owner",
      threadId: "thread",
    };
    const view = render(<Component {...props} />);
    expect(mockRows).toHaveBeenCalledTimes(count);
    mockRows.mockClear();
    const refetched = replaceEqualDeep(data, JSON.parse(JSON.stringify(data)));
    view.rerender(<Component {...props} data={refetched} />);
    expect(mockRows).not.toHaveBeenCalled();
    const edited = replaceEqualDeep(
      refetched,
      data.map((row, i) =>
        i === 3 ? { ...row, description: "edited old message" } : row,
      ),
    );
    view.rerender(<Component {...props} data={edited} />);
    expect(mockRows.mock.calls).toEqual([["edited old message"]]);
    mockRows.mockClear();
    view.rerender(
      <Component
        {...props}
        data={[...edited, { ...data[0], id: "new", description: "incoming" }]}
      />,
    );
    expect(mockRows.mock.calls).toEqual([["incoming"]]);
    mockRows.mockClear();
  },
);
