import type { FrameworkLinkResolver } from "../interface";
import { Icon } from "../primitives";
import { PreviewLink, siteStyles } from "../Site";
import { blogCover, categories, type IBlogCategory } from "./content";
interface ICategoryLinksProps {
  items?: readonly IBlogCategory[];
  resolveLink?: FrameworkLinkResolver;
}
/** Page-owned cards for the selected Blog categories. */
export function FeaturedCategories({
  items = categories,
  resolveLink,
}: ICategoryLinksProps) {
  return (
    <div className="grid gap-3 @3xl:grid-cols-3">
      {items.map((category) => (
        <PreviewLink
          key={category.slug}
          href={`/blog/categories/${category.slug}`}
          resolveLink={resolveLink}
          className={`group flex min-w-0 items-start gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition hover:border-[hsl(var(--muted-foreground))] motion-reduce:transition-none ${siteStyles.focus}`}
        >
          <img
            src={blogCover(category.cover)}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            className="aspect-square size-16 shrink-0 rounded-xl object-cover @5xl:size-20"
          />
          <span className="min-w-0">
            <span
              className={`flex items-center gap-2 text-base ${siteStyles.display}`}
            >
              {category.title}
              <Icon name="arrow-up-right" size={20} />
            </span>
            <span
              className={`mt-1 block text-sm leading-6 ${siteStyles.muted}`}
            >
              {category.description}
            </span>
          </span>
        </PreviewLink>
      ))}
    </div>
  );
}
