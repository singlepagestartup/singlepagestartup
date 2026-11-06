import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Model } from "../..";
const meta = {
  id: "modules-blog-models-widget-singlepage-article-find-grid",
  title: "Modules/Blog/Widget/Singlepage/article-find-grid",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "article-find-grid",
    id: "module-grid",
    eyebrow: "Используйте проверенный код",
    title: "Модули для вашего проекта",
    cardLayout: "module",
    articles: [
      {
        id: "accounts",
        slug: "accounts",
        title: "Аккаунты и доступ",
        excerpt: "Вход в аккаунт и доступ к личным данным.",
        coverImage:
          "/module-assets/images/singlepage/generated/framework-acquisition-v2/accounts.png",
        href: "#accounts",
      },
    ],
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Model>, { variant: "article-find-grid" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Guides: Story = {
  args: {
    cardLayout: "guide",
    articleActionLabel: "Как работает модуль",
    articles: [
      {
        id: "social",
        slug: "social",
        category: "01 / Social",
        title: "Профили и общение",
        excerpt: "",
        coverImage:
          "/module-assets/images/singlepage/generated/framework-article-covers-dark-v1/social.png",
        href: "#social",
      },
    ],
  },
};
