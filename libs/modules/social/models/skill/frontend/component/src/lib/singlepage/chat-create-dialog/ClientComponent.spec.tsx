/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component } from "./index";

it("creates a chat command from a Russian title and preserves it on edit", async () => {
  const onCreate = jest.fn();
  const onUpdate = jest.fn();
  const props = {
    isServer: false,
    variant: "chat-create-dialog" as const,
    language: "ru",
    open: true,
    orderIndex: 0,
    profileId: "employee",
    onOpenChange: jest.fn(),
    onCreate,
    onUpdate,
  };
  const { rerender } = render(<Component {...props} />);

  fireEvent.change(screen.getByLabelText("Название"), {
    target: { value: "Описание товара" },
  });
  fireEvent.change(screen.getByLabelText("Инструкция"), {
    target: { value: "Опиши назначение товара." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать навык" }));

  const values = {
    title: "Описание товара",
    slug: "opisanie-tovara",
    description: "Опиши назначение товара.",
  };
  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(values, {
      orderIndex: 0,
      profileId: "employee",
    }),
  );

  const skill = {
    ...values,
    id: "skill",
    variant: "default",
    className: null,
    adminTitle: values.title,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  rerender(<Component {...props} mode="edit" data={skill} />);
  expect(screen.getByDisplayValue("opisanie-tovara")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Название"), {
    target: { value: "Карточка товара" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить навык" }));

  await waitFor(() =>
    expect(onUpdate).toHaveBeenCalledWith(skill, {
      ...values,
      title: "Карточка товара",
    }),
  );
});
