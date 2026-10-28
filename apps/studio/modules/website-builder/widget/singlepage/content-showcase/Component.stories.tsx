import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-showcase",
  title: "Modules/Website-Builder/Widget/Singlepage/content-showcase",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-showcase",
    id: "showcase",
    eyebrow: "Найдите сценарий для своей идеи",
    title: "Посмотрите, каким может быть ваш продукт",
    description: "Начните с функций, которые нужны вашему бизнесу.",
    selectorLabel: "Примеры продуктов",
    previewLabel: "Снимок продукта",
    items: [
      {
        id: "contacts",
        title: "Сбор контактов",
        description:
          "Посетитель знакомится с программой и записывается на вебинар.",
        preview: {
          src: "/module-assets/images/singlepage/generated/framework-example-previews/contact.png",
          alt: "Программа вебинара и форма записи.",
          width: 340,
          height: 1908,
        },
      },
      {
        id: "courses",
        title: "Магазин курсов",
        description: "Покупатель выбирает курс в каталоге.",
        preview: {
          src: "/module-assets/images/singlepage/generated/framework-example-previews/courses.png",
          alt: "Каталог курсов.",
          width: 340,
          height: 995,
        },
      },
    ],
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "content-showcase" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
