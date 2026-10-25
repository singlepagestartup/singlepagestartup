import type { IExampleArticle, IExampleCourse } from "./interface";
import { blogCover } from "../Blog/content";

/** Generated concept assets for the fictional webinar example. */
export const webinarArtwork = Object.fromEntries(
  ["idea", "build", "launch", "mentor"].map((key) => [
    key,
    {
      src: `/module-assets/images/singlepage/generated/framework-webinar-v1/${key}.png`,
      id: `singlepage-generated-framework-webinar-v1-${key}`,
    },
  ]),
);

/** Illustrative course records, not the runtime catalogue or AI Chat tariffs. */
export function exampleCourses(
  labels: Record<string, string>,
): IExampleCourse[] {
  return [
    {
      id: "first-product",
      title: labels["demo-course-one"],
      description: labels["demo-course-one-description"],
      lessons: labels["demo-course-one-lessons"],
      rub: 4900,
      usd: 59,
    },
    {
      id: "ai-chat",
      title: labels["demo-course-two"],
      description: labels["demo-course-two-description"],
      lessons: labels["demo-course-two-lessons"],
      rub: 7900,
      usd: 99,
    },
  ];
}

export function exampleArticles(
  labels: Record<string, string>,
): IExampleArticle[] {
  return ["next-server-client", "hono-layered-api", "safe-build-rollout"].map(
    (cover, index) => ({
      id: `article-${index + 1}`,
      title: labels[`demo-journal-${index + 1}-title`],
      category:
        labels[index === 0 ? "demo-category-agents" : "demo-category-practice"],
      author: labels[index === 1 ? "demo-member-two" : "demo-member-one"],
      excerpt: labels[`demo-journal-${index + 1}-excerpt`],
      body: labels[`demo-journal-${index + 1}-body`],
      privateBody: labels[`demo-journal-${index + 1}-private`] ?? "",
      cover: blogCover(cover),
    }),
  );
}

export function examplePrice(amount: number, currency: "RUB" | "USD") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
