/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { OPEN_AI_STAGE_TEXT_DEFAULT } from "@sps/shared-utils/provider-models";
import { StageEditor } from "./StageEditor";
import { StageList } from "./StageList";

function editorProps(): ComponentProps<typeof StageEditor> {
  const stage = {
    id: "pay",
    name: "Оплата заказа",
    behavior: "ecommerce-module-order-payment" as const,
    defaultAssigneeSubjectId: "agent",
    actions: [],
  };
  return {
    stage,
    options: {
      participants: [{ id: "agent", name: "Алиса", kind: "ai" }],
      canManageEmployees: true,
      employees: [],
      payers: [],
      currencies: [],
      skillsByAssignee: {},
    },
    maintenance: false,
    kind: "individual-service",
    language: "ru",
    employeesUrl: "/ru/shop/employees",
    canSave: true,
    canRemove: true,
    onSave: jest.fn(),
    onRemove: jest.fn(),
    onChange: jest.fn(),
  };
}

it("shows the stage name once and places delete before save", () => {
  const props = editorProps();
  const { rerender } = render(<StageEditor {...props} />);
  expect(screen.queryByRole("heading", { name: props.stage.name })).toBeNull();
  expect(screen.getByRole("textbox", { name: "Название этапа" })).toHaveValue(
    props.stage.name,
  );
  const actions = screen.getByRole("group", { name: "Действия с этапом" });
  const [remove, save] = within(actions).getAllByRole("button");
  expect(remove).toHaveAccessibleName("Удалить этап");
  expect(save).toHaveAccessibleName("Сохранить этап");
  fireEvent.click(save);
  fireEvent.click(remove);
  expect(props.onSave).toHaveBeenCalledTimes(1);
  expect(props.onRemove).toHaveBeenCalledTimes(1);
  rerender(<StageEditor {...props} canSave={false} />);
  expect(save).toBeDisabled();
  expect(remove).toBeEnabled();
  rerender(<StageEditor {...props} onSave={undefined} canRemove={false} />);
  expect(screen.queryByRole("button", { name: "Сохранить этап" })).toBeNull();
  expect(remove).toBeDisabled();
});

it("keeps an outlined model control for automatic and fixed payment-stage selections", () => {
  const props = editorProps();
  const { rerender } = render(<StageEditor {...props} />);
  const model = screen.getByRole("button", { name: "Используемая модель" });
  expect(model).toHaveClass("border", "border-border");
  expect(model).toHaveTextContent("Авто");
  rerender(
    <StageEditor
      {...props}
      stage={{ ...props.stage, provider: OPEN_AI_STAGE_TEXT_DEFAULT }}
    />,
  );
  expect(model).toHaveClass("border", "border-border");
  expect(model).toHaveTextContent("GPT-6.2 Astra");
  expect(screen.getByRole("button", { name: "Режим рассуждения" })).toHaveClass(
    "border",
    "border-border",
  );
});

it("keeps keyboard reordering on each stage handle and highlights the entire row", () => {
  const props = editorProps();
  const onMove = jest.fn();
  const onSelect = jest.fn();
  render(
    <StageList
      stages={[props.stage, { id: "delivery", name: "Доставка", actions: [] }]}
      selectedId={props.stage.id}
      disabled={false}
      onMove={onMove}
      onSelect={onSelect}
      onAdd={jest.fn()}
    />,
  );
  const row = screen.getByRole("button", { name: "Доставка" }).closest("li");
  expect(row).toHaveClass("hover:bg-muted", "focus-within:bg-muted");
  const handle = within(row!).getByRole("button", {
    name: "Изменить позицию этапа «Доставка»",
  });
  fireEvent.keyDown(handle, { key: "ArrowUp" });
  expect(onMove).toHaveBeenCalledWith("delivery", "pay");
  fireEvent.click(within(row!).getByRole("button", { name: "Доставка" }));
  expect(onSelect).toHaveBeenCalledWith("delivery");
  expect(screen.queryByRole("group", { name: /Действия с этапом/ })).toBeNull();
});

it("allows editing an unsaved stage but only moves persisted stages in an existing funnel", () => {
  const props = editorProps();
  const onMove = jest.fn();
  const onSelect = jest.fn();
  const draft = { id: "draft", name: "Черновик", actions: [] };
  const delivery = { id: "delivery", name: "Доставка", actions: [] };
  const common = {
    stages: [props.stage, delivery, draft],
    selectedId: props.stage.id,
    disabled: false,
    onMove,
    onSelect,
    onAdd: jest.fn(),
  };
  const { rerender } = render(
    <StageList
      {...common}
      savedStageIds={new Set([props.stage.id, delivery.id])}
    />,
  );
  const draftButton = screen.getByRole("button", { name: draft.name });
  const draftHandle = screen.getByRole("button", {
    name: "Изменить позицию этапа «Черновик»",
  });
  expect(draftHandle).toBeDisabled();
  fireEvent.click(draftButton);
  expect(onSelect).toHaveBeenCalledWith(draft.id);
  const handle = screen.getByRole("button", {
    name: "Изменить позицию этапа «Доставка»",
  });
  fireEvent.keyDown(handle, { key: "ArrowDown" });
  expect(onMove).not.toHaveBeenCalled();
  const original = Object.getOwnPropertyDescriptor(
    document,
    "elementFromPoint",
  );
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => draftButton,
  });
  Object.defineProperty(handle, "setPointerCapture", {
    configurable: true,
    value: jest.fn(),
  });
  try {
    for (const type of ["pointerdown", "pointermove", "pointerup"]) {
      fireEvent(
        handle,
        Object.assign(new MouseEvent(type, { bubbles: true, button: 0 }), {
          isPrimary: true,
          pointerId: 1,
        }),
      );
    }
    expect(onMove).not.toHaveBeenCalled();
  } finally {
    if (original) Object.defineProperty(document, "elementFromPoint", original);
    else Reflect.deleteProperty(document, "elementFromPoint");
  }
  fireEvent.keyDown(handle, { key: "ArrowUp" });
  expect(onMove).toHaveBeenCalledWith(delivery.id, props.stage.id);
  rerender(<StageList {...common} />);
  expect(draftHandle).toBeEnabled();
  fireEvent.keyDown(draftHandle, { key: "ArrowUp" });
  expect(onMove).toHaveBeenLastCalledWith(draft.id, delivery.id);
});

it("shows reminder controls inline and uses the stage instructions for uploaded materials", () => {
  const props = editorProps();
  const stage = {
    ...props.stage,
    behavior: undefined,
    output: "image" as const,
    imageBrief: "marketplace-cover" as const,
  };
  const { container, rerender } = render(
    <StageEditor {...props} stage={stage} />,
  );
  expect(container.querySelector("details")).toBeNull();
  expect(
    screen.queryByText(/фотографии для обложки|обложка товара по брифу/i),
  ).toBeNull();
  for (const name of [
    "Что делает исполнитель",
    "Напоминания клиенту",
    "Оплата",
  ]) {
    expect(screen.getByRole("heading", { name })).toBeVisible();
  }
  const toggle = screen.getByRole("checkbox", {
    name: "Напоминать, если клиент не ответил",
  });
  const deadline = screen.getByRole("spinbutton", { name: "Срок ожидания, ч" });
  expect(deadline).toBeVisible();
  expect(deadline).toBeDisabled();
  fireEvent.click(toggle);
  const patch = (props.onChange as jest.Mock).mock.lastCall[0];
  expect(patch.waiting.expectedEvent).toBe("message");
  rerender(<StageEditor {...props} stage={{ ...stage, ...patch }} />);
  expect(deadline).toBeEnabled();
  expect(deadline).toHaveValue(24);
  expect(
    screen.getByRole("textbox", { name: "Напоминания через, ч" }),
  ).toHaveValue("12");
  fireEvent.click(toggle);
  expect(props.onChange).toHaveBeenLastCalledWith({ waiting: undefined });
});

it("lets a manager fund an individual service stage using its order formula", () => {
  const props = editorProps();
  const { rerender } = render(<StageEditor {...props} />);
  fireEvent.change(screen.getByLabelText("Как рассчитывать стоимость работы"), {
    target: { value: "formula" },
  });
  const patch = (props.onChange as jest.Mock).mock.lastCall[0];
  expect(patch.workFunding).toMatchObject({
    payer: "customer",
    orderFormula: true,
  });
  expect(patch.workFunding.multiplier).toBeUndefined();
  rerender(<StageEditor {...props} stage={{ ...props.stage, ...patch }} />);
  expect(
    screen.queryByLabelText("Коэффициент стоимости для клиента"),
  ).toBeNull();
});
