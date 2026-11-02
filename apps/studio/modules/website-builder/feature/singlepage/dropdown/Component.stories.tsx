import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFeatureDropdownProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-dropdown",
  title: "Modules/Website-Builder/Feature/Singlepage/dropdown",
  component: Feature,
  parameters: {
    layout: "padded",
  },
  args: { ...defaultFeatureDropdownProps, variant: "dropdown" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "dropdown" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Collapsed: Story = {
  name: "collapsed",
  args: { open: false },
};

export const Card: Story = {
  args: {
    appearance: "card",
    open: false,
    question: "Нужно ли уметь программировать, чтобы начать?",
    answer:
      "Опишите свою идею ИИ-помощнику и выберите функции для первой версии.",
  },
};
export const Document: Story = {
  args: {
    appearance: "document",
    open: false,
    question: "Бриф",
    answer: "Для кого продукт и какую задачу он решает.",
    exampleLabel: "Пример содержания",
    example: "Школа создания ИИ-продуктов.",
  },
};
