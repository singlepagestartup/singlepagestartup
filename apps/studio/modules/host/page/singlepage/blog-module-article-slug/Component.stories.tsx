import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { frameworkArticlePreviews } from "../../../../blog/article";

const meta = {
  id: "modules-host-models-page-singlepage-blog-module-article-slug",
  title: "Modules/Host/Page/Singlepage/blog-module-article-slug",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    variant: "blog-module-article-slug",
    articleSlug: frameworkArticlePreviews[0].slug,
  },
  argTypes: {
    articleSlug: {
      control: "select",
      options: frameworkArticlePreviews.map((article) => article.slug),
    },
  },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "blog-module-article-slug" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
export const Hono: Story = {
  args: { articleSlug: "hono-api-layers-di-and-owned-middleware" },
};
export const LocalStack: Story = {
  args: { articleSlug: "nx-bun-docker-and-generated-migrations" },
};
export const Missing: Story = { args: { articleSlug: "not-in-the-journal" } };
export const WithReplies: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Supplied preview comments exercise avatars, likes and nested replies; these are not production engagement counts.",
      },
    },
  },
  args: {
    totalComments: 3,
    comments: [
      {
        id: "guide-preview-comment",
        author: "Читатель блога",
        avatar: "",
        date: "23 окт. 2026 г.",
        text: "Можно ли изменить представление Article и сохранить запрос в родительском компоненте?",
        likes: 2,
        replies: [
          {
            id: "guide-preview-reply",
            author: frameworkArticlePreviews[0].authorName,
            avatar: frameworkArticlePreviews[0].authorAvatar,
            date: "23 окт. 2026 г.",
            text: "Используйте dataSource props и оставьте подписку на запрос у владеющего reader.",
            likes: 1,
            replies: [
              {
                id: "guide-preview-follow-up",
                author: "Читатель блога",
                avatar: "",
                date: "23 окт. 2026 г.",
                text: "Теперь вижу, кто отвечает за загрузку. Спасибо.",
                likes: 0,
              },
            ],
          },
        ],
      },
    ],
  },
};
