import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Subject } from "../../../../../..";
import { AccountProvider } from "../../../../account/Account";
import { aiChatAccount } from "../../../../account/fixture";
import type { IRepeatState } from "./interface";

function render(repeatState: IRepeatState) {
  return renderToStaticMarkup(
    <AccountProvider account={aiChatAccount}>
      <Subject
        variant="me-ecommerce-module-order-list-ai-chat"
        repeatState={repeatState}
      />
    </AccountProvider>,
  );
}

test("history exposes repeat and explains replacement before repeating a pending payment", () => {
  const html = render("confirmation");
  expect(html).toContain("Повторить заказ");
  expect(html).toContain("Ожидает оплаты");
  expect(html).toContain(
    "Текущие товары в корзине этого профиля будут заменены",
  );
  expect(html).toContain("Прежняя оплата не отменяется");
  expect(html).toContain("другой способ оплаты");
  expect(html).toContain("Заменить корзину");
  expect(html).toContain("Отмена");
});

test("only the repeated row shows pending and success offers the cart", () => {
  const pending = render("pending");
  expect(pending.match(/Повторяем…/g)).toHaveLength(1);
  expect(pending.match(/Повторить заказ/g)).toHaveLength(2);
  expect(render("success")).toContain("Открыть корзину");
  expect(render("error")).toContain("Не удалось повторить заказ");
});
