import listSource from "./list.md?raw";
import categorySource from "./category.md?raw";
import articleSource from "./article.md?raw";
import readersSource from "./articles/nextjs-server-client-readers-and-widget-slots.md?raw";
import cacheSource from "./articles/react-query-realtime-and-principal-scopes.md?raw";
import honoSource from "./articles/hono-api-layers-di-and-owned-middleware.md?raw";
import accessSource from "./articles/framework-private-content-audit.md?raw";
import localSource from "./articles/nx-bun-docker-and-generated-migrations.md?raw";
import releaseSource from "./articles/building-and-revalidating-sps-with-safe-content-cutovers.md?raw";

export interface IBlogDocument {
  meta: Record<string, string>;
  body: string;
}

export interface IBlogCategory {
  slug: string;
  title: string;
  description: string;
  cover: string;
}

export interface IBlogArticle {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  cover: string;
  coverAlt: string;
  author: string;
  authorRole: string;
  /** Authored preview creation date, without a production publication claim. */
  createdAt?: string;
  body: string;
  minutes: number;
}

export interface IBlogHeading {
  title: string;
  id: string;
}

const imageRoot = "/workspace-assets/singlepage/generated/living-focus/blog";

export function blogCover(cover: string): string {
  return `${imageRoot}/${cover}-square.png`;
}

/** Product copy is local Markdown, without runtime data or SDK imports. */
export function parseBlogDocument(text: string): IBlogDocument {
  const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  const meta: Record<string, string> = {};
  if (frontmatter) {
    for (const line of frontmatter[1].split("\n")) {
      const match = line.match(/^([\w-]+):\s*(.*?)\s*$/);
      if (!match) continue;
      try {
        const value: unknown = JSON.parse(match[2]);
        if (typeof value === "string") meta[match[1]] = value;
      } catch {
        meta[match[1]] = match[2];
      }
    }
  }
  return { meta, body: text.slice(frontmatter?.[0].length ?? 0).trim() };
}

export const blogCopy = parseBlogDocument(listSource).meta;
export const categoryCopy = parseBlogDocument(categorySource).meta;
export const articleCopy = parseBlogDocument(articleSource).meta;

export function parseBlogCategories(text: string): IBlogCategory[] {
  const body = text.split("<!-- categories -->")[1] ?? "";
  return body
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .slice(2)
    .map((line) => {
      const [slug, title, description, cover] = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      return { slug, title, description, cover };
    })
    .filter((category) => category.slug && category.title);
}

export const categories = parseBlogCategories(listSource);

/** Keep calendar dates exact; Date's rollover must not repair invalid author input. */
export function parseBlogDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

export function formatBlogDate(value: string | undefined): string | undefined {
  const date = parseBlogDate(value);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : undefined;
}

export function parseBlogArticle(source: string): IBlogArticle {
  const { meta, body } = parseBlogDocument(source);
  const required = [
    "slug",
    "category",
    "title",
    "excerpt",
    "cover",
    "coverAlt",
    "author",
    "authorRole",
  ] as const;
  for (const key of required) {
    if (!meta[key]) throw new Error(`Blog article is missing ${key}.`);
  }
  return {
    slug: meta.slug,
    category: meta.category,
    title: meta.title,
    excerpt: meta.excerpt,
    cover: meta.cover,
    coverAlt: meta.coverAlt,
    author: meta.author,
    authorRole: meta.authorRole,
    createdAt: parseBlogDate(meta.createdAt),
    body,
    minutes: Math.max(1, Math.ceil(body.split(/\s+/).length / 190)),
  };
}

export const articles: readonly IBlogArticle[] = [
  readersSource,
  cacheSource,
  honoSource,
  accessSource,
  localSource,
  releaseSource,
].map(parseBlogArticle);

export function selectBlogArticles(
  collection: readonly IBlogArticle[],
  category: string,
  query: string,
): IBlogArticle[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return collection.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    const searchable =
      `${article.title} ${article.excerpt} ${article.category} ${article.body}`.toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

/** An explicit invalid route stays invalid; only a sidebar selection uses the example. */
export function blogRouteSlug(
  href: string | undefined,
  kind: "categories" | "articles",
  fallback: string,
): string | undefined {
  if (!href) return fallback;
  try {
    const url = new URL(href, "https://product-preview.invalid");
    if (url.origin !== "https://product-preview.invalid") return undefined;
    const match = url.pathname.match(new RegExp(`^/blog/${kind}/([^/]+)/?$`));
    if (!match) return undefined;
    const slug = decodeURIComponent(match[1]);
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : undefined;
  } catch {
    return undefined;
  }
}

export function blogHeadingId(title: string): string {
  return `guide-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function blogHeadings(body: string): IBlogHeading[] {
  const prose = body.replace(
    /(?:^|\n)(?:~~~|```)[\s\S]*?(?:\n)(?:~~~|```)/g,
    "",
  );
  return [...prose.matchAll(/^##\s+(.+)$/gm)].map((match) => ({
    title: match[1],
    id: blogHeadingId(match[1]),
  }));
}
