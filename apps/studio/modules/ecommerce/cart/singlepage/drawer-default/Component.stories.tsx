import { Component as Cart } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { cartPurchaseScenarios, type CartPurchaseScenario } from "../../shared";

import { defaultCartDrawerDefaultProps } from "./Component";

const meta = {
  id: "modules-ecommerce-models-cart-singlepage-cart-drawer-default",
  title: "Modules/Ecommerce/Cart/Singlepage/cart-drawer-default",
  component: Cart,
  parameters: {
    layout: "fullscreen",
  },
  args: { ...defaultCartDrawerDefaultProps, variant: "drawer-default" },
  argTypes: {
    purchaseScenario: {
      control: "select",
      options: Object.keys(cartPurchaseScenarios),
    },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Cart>, { variant: "drawer-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Empty: Story = {
  name: "empty",
  args: {
    items: [],
  },
};

function purchase(scenario: CartPurchaseScenario): Story {
  return { args: { purchaseScenario: scenario } };
}

async function openComparison(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(
    canvas.getAllByRole("button", { name: "Сравнить магазины" })[0],
  );
  const dialog = within(
    await canvas.findByRole("dialog", { name: "Сравнение магазинов" }),
  );
  return { canvas, dialog };
}

export const WardrobeCity: Story = {
  ...purchase("wardrobe-city"),
  name: "Шкаф · Петербург · 8 000 ₽",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(/8\s000 ₽/);
    await userEvent.selectOptions(
      canvas.getByLabelText("Адрес, заказ 1"),
      "region",
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(/9\s000 ₽/);
    await userEvent.selectOptions(
      canvas.getByLabelText("Адрес, заказ 1"),
      "city",
    );
  },
};

export const WardrobeRegion: Story = {
  ...purchase("wardrobe-region"),
  name: "Шкаф · область · 9 000 ₽",
};

export const TwoOneAssembly: Story = {
  ...purchase("two-one-assembly"),
  name: "Два шкафа · одна сборка · 13 000 ₽",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /13\s000 ₽/,
    );
    await userEvent.selectOptions(
      canvas.getByLabelText("Количество сборок, заказ 1"),
      "2",
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /15\s000 ₽/,
    );
    await userEvent.selectOptions(
      canvas.getByLabelText("Количество сборок, заказ 1"),
      "1",
    );
  },
};

export const TwoBothAssembly: Story = {
  ...purchase("two-both-assembly"),
  name: "Два шкафа · две сборки · 15 000 ₽",
};

export const SellerComparison: Story = {
  ...purchase("seller-comparison"),
  name: "Сравнение · 8 000 ₽ и 7 400 ₽",
  play: async ({ canvasElement }) => {
    const { dialog } = await openComparison(canvasElement);
    await expect(dialog.getByText(/8\s000 ₽/)).toBeVisible();
    await expect(dialog.getByText(/7\s400 ₽/)).toBeVisible();
  },
};

export const SellerChangeCancelled: Story = {
  ...purchase("seller-comparison"),
  name: "Отмена смены · 8 000 + 7 000 ₽",
  play: async ({ canvasElement }) => {
    const { canvas, dialog } = await openComparison(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Оставить текущий магазин" }),
    );
    await expect(canvas.getByTestId("order-a-breakdown")).toHaveTextContent(
      /8\s000 ₽/,
    );
    await expect(canvas.getByTestId("order-b-breakdown")).toHaveTextContent(
      /7\s000 ₽/,
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /15\s000 ₽/,
    );
  },
};

export const SellerChangeApplied: Story = {
  ...purchase("seller-comparison"),
  name: "Смена подтверждена · 14 400 ₽",
  play: async ({ canvasElement }) => {
    const { canvas, dialog } = await openComparison(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Выбрать этот магазин" }),
    );
    await expect(canvas.getByTestId("order-a-breakdown")).toHaveTextContent(
      /7\s400 ₽/,
    );
    await expect(canvas.getByTestId("order-b-breakdown")).toHaveTextContent(
      /7\s000 ₽/,
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /14\s400 ₽/,
    );
  },
};

export const TariffChanged: Story = {
  ...purchase("tariff-changed"),
  name: "Тариф изменился перед применением",
  play: async ({ canvasElement }) => {
    const { canvas, dialog } = await openComparison(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Выбрать этот магазин" }),
    );
    await expect(dialog.getByRole("alert")).toHaveTextContent(
      /7 600 ₽ вместо 7 400 ₽/,
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /15\s000 ₽/,
    );
  },
};

export const NewTariffConfirmed: Story = {
  ...purchase("tariff-changed"),
  name: "Новая цена подтверждена · 14 600 ₽",
  play: async ({ canvasElement }) => {
    const { canvas, dialog } = await openComparison(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Выбрать этот магазин" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Подтвердить новую цену" }),
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /14\s600 ₽/,
    );
  },
};

export const SoldOut: Story = {
  ...purchase("sold-out"),
  name: "Распродано · выбор сохранён",
};

export const SoldOutAlternative: Story = {
  ...purchase("sold-out"),
  name: "Распродано · выбран другой магазин",
  play: async ({ canvasElement }) => {
    const { canvas, dialog } = await openComparison(canvasElement);
    await userEvent.click(
      dialog.getByRole("button", { name: "Выбрать этот магазин" }),
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(/7\s400 ₽/);
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeEnabled();
  },
};

export const StockShortage: Story = {
  ...purchase("stock-shortage"),
  name: "Недостаточный остаток · доступна 1 шт.",
};

export const StockQuantityCorrected: Story = {
  ...purchase("stock-shortage"),
  name: "Количество исправлено по остатку",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeDisabled();
    await userEvent.selectOptions(
      canvas.getByLabelText("Количество, заказ 1"),
      "1",
    );
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(/8\s000 ₽/);
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeEnabled();
  },
};

export const CurrencyUnavailable: Story = {
  ...purchase("currency-unavailable"),
  name: "Валюта недоступна для комплекта услуг",
};

export const CurrencyCorrected: Story = {
  ...purchase("currency-unavailable"),
  name: "Валюта исправлена на RUB",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeDisabled();
    await userEvent.selectOptions(
      canvas.getByLabelText("Валюта, заказ 1"),
      "RUB",
    );
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeEnabled();
  },
};

export const MixedCurrencies: Story = {
  ...purchase("mixed-currencies"),
  name: "Два счёта · 11 000 ₽ и 20 USD",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("total-RUB")).toHaveTextContent(
      /11\s000 ₽/,
    );
    await expect(canvas.getByTestId("total-USD")).toHaveTextContent("20 USD");
    await userEvent.click(canvas.getByRole("button", { name: "К оформлению" }));
    await expect(
      canvas.getByRole("region", { name: "Предварительные счета" }),
    ).toBeVisible();
  },
};

export const DistanceTariff: Story = {
  ...purchase("distance-tariff"),
  name: "Маршрут 24 км и сборка 10% · 6 500 ₽",
};

export const TokensOnly: Story = {
  ...purchase("tokens-only"),
  name: "Токены · без адреса · 20 USD",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByLabelText(/Адрес, заказ/),
    ).not.toBeInTheDocument();
    await expect(canvas.getByTestId("total-USD")).toHaveTextContent("20 USD");
  },
};

export const ElectronicDelivery: Story = {
  ...purchase("electronic-delivery"),
  name: "Платная электронная выдача · 22 USD",
};

export const Subscription: Story = {
  ...purchase("subscription"),
  name: "Подписка · первая и следующие поставки",
};

export const IncompleteSelection: Story = {
  ...purchase("incomplete-selection"),
  name: "Не выбран адрес · оформление недоступно",
};

export const RequiredDelivery: Story = {
  ...purchase("required-delivery"),
  name: "Обязательная доставка · без самовывоза",
};

export const QuoteError: Story = {
  ...purchase("quote-error"),
  name: "Ошибка и повтор расчёта одной строки",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Повторить расчёт" }),
    );
    await expect(canvas.getByTestId("order-a")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.getByTestId("order-b")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(
      canvas.findByText("Расчёт заказа обновлён. Остальные заказы сохранены."),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "К оформлению" }),
    ).toBeEnabled();
  },
};

export const Mobile: Story = {
  ...purchase("seller-comparison"),
  name: "Мобильная корзина · 375 px",
  render: (args) => (
    <div className="relative isolate h-[812px] w-[375px] max-w-full transform-gpu overflow-hidden">
      <Cart {...args} variant="drawer-default" />
    </div>
  ),
};
