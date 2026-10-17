import type {
  IComponentProps,
  ArticleFindCardDefaultArticle,
  ArticleFindCardDefaultProps,
} from "./interface";
export type {
  ArticleFindCardDefaultArticle,
  ArticleFindCardDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  useId,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useState,
} from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Article } from "../../../article/index";
import { type CategoryButtonDefaultProps } from "../../../category/index";
interface ICollectionPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
function CollectionPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ICollectionPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Collection pages"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"
    >
      <p className={`text-sm ${kit.muted}`} aria-live="polite">
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 results"}{" "}
        · Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="caret-left" />
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon name="caret-right" />
        </Button>
      </div>
    </nav>
  );
}
interface ICategoryChoiceProps extends ICollectionCategory {
  active: boolean;
  onSelect?: (slug: string) => void;
}
function CategoryChoice({
  slug,
  label,
  count,
  active,
  onSelect,
}: ICategoryChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect?.(slug)}
      className={`${sectionChoiceClass} ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs ${kit.muted}`}>{count}</span>
      )}
      {active && <span aria-hidden="true" className={sectionIndicatorClass} />}
    </button>
  );
}
interface ICollectionCategory {
  slug: string;
  label: string;
  count?: number;
}
interface ICollectionToolbarProps {
  categories: ICollectionCategory[];
  category: string;
  onCategoryChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
}
function CollectionToolbar({
  categories,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  searchLabel,
}: ICollectionToolbarProps) {
  const id = useId();
  return (
    <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-1 rounded-xl bg-muted p-1"
      >
        {categories.map((item) => (
          <CategoryChoice
            key={item.slug}
            {...item}
            active={category === item.slug}
            onSelect={onCategoryChange}
          />
        ))}
      </div>
      <label htmlFor={id} className="relative">
        <span className="sr-only">{searchLabel}</span>
        <Icon
          name="magnifying-glass"
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${kit.muted}`}
        />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          className={`${kit.field} pl-12`}
        />
      </label>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ArticleFindCardDefault(props?: IComponentProps) {
  const { categories, articles } = {
    ...defaultArticleFindCardDefaultProps,
    ...props,
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const chooseCategory = useCallback((slug: string) => {
    setCategory(slug);
    setPage(1);
  }, []);
  const search = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);
  const filtered = articles.filter(
    (article) =>
      (category === "all" || article.category === category) &&
      `${article.title} ${article.excerpt} ${article.authorName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const activePage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / pageSize)),
  );
  const visible = filtered.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <section
      aria-label="Article collection"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      data-ds-block="blog.widget.article-find-card-default"
      data-ds-imports="blog.category.button-default blog.article.card"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="widget"
      data-variant={props?.variant ?? "article-find-card-default"}
    >
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        All articles
      </h2>
      <CollectionToolbar
        categories={categories}
        category={category}
        onCategoryChange={chooseCategory}
        query={query}
        onQueryChange={search}
        searchLabel="Search articles"
      />
      <p className={`mb-6 text-sm ${kit.muted}`} aria-live="polite">
        {filtered.length} articles
      </p>
      {filtered.length > 0 ? (
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <Article
              variant="card"
              key={article.id}
              href={article.href ?? articleOverviewStoryHref}
              slug={article.slug}
              coverImage={article.coverImage}
              category={article.category}
              date={article.date}
              title={article.title}
              excerpt={article.excerpt}
              authorName={article.authorName}
              authorAvatar={article.authorAvatar}
              authorSlug={article.authorSlug}
              commentCount={article.commentCount}
              readTime={article.readTime}
              target="_top"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <h3 className="text-2xl font-semibold">No matching articles</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Try another search or choose a different category.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <CollectionPagination
        page={activePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
      />
    </section>
  );
}
const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary text-primary-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  focus: focus,
};
const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-slug--default";
const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const marcusAvatar =
  "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
export const defaultArticleFindCardDefaultProps = {
  categories: [
    { slug: "all", label: "All Posts", count: 6 },
    { slug: "guides", label: "Guides", count: 2 },
    { slug: "engineering", label: "Engineering", count: 2 },
    { slug: "product", label: "Product", count: 1 },
    { slug: "case-study", label: "Case Studies", count: 1 },
  ] as BlogCategoryTab[],
  articles: [
    {
      id: "art-1",
      slug: "how-to-choose",
      title: "How to Choose the Right Plan for Your Business",
      excerpt:
        "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
      category: "guides",
      date: "Feb 18, 2026",
      readTime: "7 min read",
      commentCount: 3,
      authorName: "Sarah Kim",
      authorSlug: "sarah-kim",
      authorAvatar: sarahAvatar,
    },
    {
      id: "art-2",
      slug: "new-features",
      title: "New Features in 2026: Everything You Need to Know",
      excerpt:
        "A rundown of the most exciting features shipped in the latest release — from the AI Agent module to the redesigned admin panel.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
      category: "product",
      date: "Feb 14, 2026",
      readTime: "6 min read",
      commentCount: 4,
      authorName: "James Carter",
      authorSlug: "james-carter",
      authorAvatar: jamesAvatar,
    },
    {
      id: "art-3",
      slug: "success-story",
      title: "How NovaBridge Scaled to 100K Users in 6 Months",
      excerpt:
        "A deep dive into how NovaBridge used our modular platform to go from prototype to 100,000 active users in half a year.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
      category: "case-study",
      date: "Feb 8, 2026",
      readTime: "9 min read",
      commentCount: 5,
      authorName: "Sarah Kim",
      authorSlug: "sarah-kim",
      authorAvatar: sarahAvatar,
    },
    {
      id: "art-4",
      slug: "getting-started",
      title: "Getting Started: From Zero to Your First Module",
      excerpt:
        "Step-by-step guide to setting up your first project, configuring a module, and creating your first entity records in under 10 minutes.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
      category: "guides",
      date: "Feb 3, 2026",
      readTime: "5 min read",
      commentCount: 2,
      authorName: "Marcus Webb",
      authorSlug: "marcus-webb",
      authorAvatar: marcusAvatar,
    },
    {
      id: "art-5",
      slug: "enterprise-security",
      title: "Enterprise Security: How We Protect Your Data",
      excerpt:
        "A deep dive into our enterprise-grade security features, from RBAC and SSO to encryption at rest and audit logging.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
      category: "engineering",
      date: "Jan 28, 2026",
      readTime: "10 min read",
      commentCount: 2,
      authorName: "James Carter",
      authorSlug: "james-carter",
      authorAvatar: jamesAvatar,
    },
    {
      id: "art-6",
      slug: "api-integration",
      title: "API Integration Tutorial: Connecting External Services",
      excerpt:
        "Step-by-step guide to integrating with our REST API, setting up webhooks, and building custom automation workflows.",
      coverImage:
        "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
      category: "engineering",
      date: "Jan 22, 2026",
      readTime: "11 min read",
      commentCount: 5,
      authorName: "Marcus Webb",
      authorSlug: "marcus-webb",
      authorAvatar: marcusAvatar,
    },
  ] as ArticleFindCardDefaultArticle[],
};

import type { BlogCategoryTab } from "./interface";
