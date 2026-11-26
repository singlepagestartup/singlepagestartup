/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderAction } from "./OrderAction";
import {
  type IFunnelStage,
  linearFunnelDefinition,
} from "@sps/crm/models/funnel/sdk/model";

const stage: IFunnelStage = {
  id: "create",
  name: "Макет",
  instruction: "Согласуй с покупателем размеры упаковки.",
  defaultAssigneeSubjectId: "781225b7-f077-49e7-8a97-80777901b6f3",
  output: "image",
  provider: { modelId: "gpt-image-2.5-flare-2026-09-08" },
  actions: [],
};

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

async function choose(label: string) {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Действие с заказом" }),
    { key: "Enter" },
  );
  fireEvent.keyDown(await screen.findByRole("option", { name: label }), {
    key: "Enter",
  });
}

it("binds customer acceptance of a file and keeps employee instructions and resets the image model for payment", async () => {
  const change = jest.fn<void, [Partial<IFunnelStage>]>();
  const props = {
    stage,
    kind: "individual-service" as const,
    language: "ru",
    onChange: change,
  };
  const { rerender } = render(<OrderAction {...props} />);
  await choose("Согласовать результат с покупателем");
  const chosen = { ...stage, ...change.mock.calls[0][0] };
  const normalized = linearFunnelDefinition({
    progression: "linear",
    initialStageId: chosen.id,
    stages: [chosen],
  }).stages[0];
  expect(normalized).toMatchObject({
    provider: stage.provider,
    output: "image",
    instruction: stage.instruction,
    defaultAssigneeSubjectId: stage.defaultAssigneeSubjectId,
    actions: [
      {
        actors: ["system"],
        evidence: ["result-accepted"],
        outcome: "completed",
      },
    ],
  });
  rerender(<OrderAction {...props} stage={normalized} />);
  expect(screen.getByRole("combobox")).toHaveTextContent(
    "Согласовать результат с покупателем",
  );
  await choose("Отправить заказ на оплату");
  const payment = { ...normalized, ...change.mock.calls[1][0] };
  expect(payment).toMatchObject({
    behavior: "ecommerce-module-order-payment",
    instruction: stage.instruction,
    defaultAssigneeSubjectId: stage.defaultAssigneeSubjectId,
    output: "chat",
  });
  expect(payment.provider).toBeUndefined();
  rerender(<OrderAction {...props} stage={payment} />);
  await choose("Без действия с заказом");
  const { behavior, actions } = change.mock.calls[2][0];
  expect(behavior).toBeUndefined();
  expect(actions).toEqual([]);
});

it("presents payment for physical orders and leaves their existing delivery milestone intact", async () => {
  const change = jest.fn();
  const shipping: IFunnelStage = {
    id: "ship",
    name: "В пути",
    instruction: "",
    actions: [
      {
        id: "handover",
        name: "Подтвердить получение",
        actors: ["system"],
        evidence: ["delivery"],
        deliveryStage: "delivered",
        outcome: "completed",
      },
    ],
  };
  render(
    <OrderAction
      stage={shipping}
      kind="physical-order"
      language="ru"
      onChange={change}
    />,
  );
  const select = screen.getByRole("combobox");
  expect(select).toHaveTextContent("Подтверждение доставки");
  fireEvent.keyDown(select, { key: "Enter" });
  expect(
    await screen.findByRole("option", { name: "Отправить заказ на оплату" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", {
      name: /результат|оригинал|отменить заказ/i,
    }),
  ).toBeNull();
  fireEvent.keyDown(
    screen.getByRole("option", { name: "Подтверждение доставки" }),
    { key: "Enter" },
  );
  expect(change).not.toHaveBeenCalled();
});
