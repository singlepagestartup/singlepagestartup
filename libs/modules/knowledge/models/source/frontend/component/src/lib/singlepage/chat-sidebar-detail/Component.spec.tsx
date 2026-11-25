/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./Component";

it("saves the personal editor from its form without offering agent management actions", () => {
  const onSave = jest.fn();
  const data = { id: "note", title: "Доставка", content: "Позвонить заранее" };
  render(
    <Component
      isServer={false}
      variant="chat-sidebar-detail"
      language="ru"
      mode="edit"
      data={data as any}
      draft={data}
      isDirty
      onDraftChange={jest.fn()}
      onSave={onSave}
    />,
  );
  expect(screen.getByLabelText("Контекст и заметки")).toHaveProperty(
    "value",
    data.content,
  );
  expect(
    screen.queryByRole("button", { name: /Удалить|Обновить индекс|Убрать/ }),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Сохранить источник знаний" }),
  );
  expect(onSave).toHaveBeenCalledWith(data);
});

it.each([
  ["ru", "Сохранить источник знаний"],
  ["en", "Save knowledge"],
])(
  "lets the owner explicitly index an unchanged historical note in %s",
  (language, saveLabel) => {
    const onSave = jest.fn();
    const data = {
      id: "note",
      title: "Серия К27",
      content: "Заметка",
      contentHash: "old",
      indexedContentHash: null,
    };
    const props = {
      data: data as any,
      draft: data,
      language,
      isServer: false as const,
      variant: "chat-sidebar-detail" as const,
      mode: "edit" as const,
      onSave,
      onDraftChange: jest.fn(),
      retryIndexOnSave: true,
    };
    const view = render(<Component {...props} needsReindex />);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: saveLabel }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(data);
    view.rerender(<Component {...props} needsReindex saveBlocked />);
    expect(screen.getByRole("button", { name: saveLabel })).toHaveProperty(
      "disabled",
      true,
    );
    view.rerender(<Component {...props} needsReindex={false} />);
    expect(screen.getByRole("button", { name: saveLabel })).toHaveProperty(
      "disabled",
      true,
    );
  },
);

it("renders Markdown headings and lists and preserves the source when returning to the editor", () => {
  const draft = {
    title: "Карточка",
    content: "## Композиция\n\n- Крупный план",
  };
  render(
    <Component
      isServer={false}
      variant="chat-sidebar-detail"
      language="ru"
      mode="create"
      data={draft as any}
      draft={draft}
      onDraftChange={jest.fn()}
      onSave={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Предпросмотр" }));
  expect(
    screen.getByRole("heading", { name: "Композиция", level: 2 }),
  ).toBeTruthy();
  expect(screen.getByRole("listitem").textContent).toBe("Крупный план");
  fireEvent.click(screen.getByRole("button", { name: "Редактор" }));
  expect(screen.getByLabelText("Контекст и заметки")).toHaveProperty(
    "value",
    draft.content,
  );
});
