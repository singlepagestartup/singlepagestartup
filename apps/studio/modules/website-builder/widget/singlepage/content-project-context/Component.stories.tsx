import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-project-context",
  title: "Modules/Website-Builder/Widget/Singlepage/content-project-context",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-project-context",
    id: "project-context",
    eyebrow: "Ваш бизнес в цифровом виде",
    title: "Дополняйте знания о проекте и используйте их в работе",
    description:
      "Описание бизнеса и клиентов сохраняется в документах проекта.",
    projectTitle: "Проект: школа",
    savedTitle: "1. Сохранённые знания",
    documents: [
      {
        id: "brief",
        title: "Бриф",
        description: "Для кого продукт и какую задачу он решает.",
        example: "Школа создания ИИ-продуктов.",
      },
    ],
    documentExampleLabel: "Пример содержания",
    taskTitle: "2. Новая задача",
    taskContext: "@knowledge · знания о проекте",
    task: "Добавь запись на новый курс.",
    taskNote: "Помощник использует сохранённое описание школы.",
    publishTitle: "3. Обновите опубликованный проект",
    publishDescription:
      "Посмотрите страницу и опубликуйте изменения через чат.",
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Model>,
    { variant: "content-project-context" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
