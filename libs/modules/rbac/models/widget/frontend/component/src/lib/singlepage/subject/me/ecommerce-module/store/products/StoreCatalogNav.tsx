import type { TStoreCatalogDirectoryKind } from "@sps/rbac/models/subject/sdk/model";
import Link from "next/link";
import { storeSectionHref } from "../paths";
import { directoryTitles } from "./directories/labels";

export function StoreCatalogNav({
  language,
  storeSlug,
  directory,
}: {
  language: string;
  storeSlug: string;
  directory?: TStoreCatalogDirectoryKind;
}) {
  const ru = language === "ru";
  const products = storeSectionHref(language, storeSlug, "products");
  const links = [
    {
      href: products,
      title: ru ? "Все товары" : "All products",
      active: !directory,
    },
    ...(["categories", "attribute-keys", "attributes"] as const).map(
      (kind) => ({
        href: products + "/" + kind,
        title: directoryTitles[kind][ru ? "ru" : "en"],
        active: directory === kind,
      }),
    ),
  ];
  return (
    <nav
      aria-label={ru ? "Каталог магазина" : "Store catalog"}
      className="flex flex-wrap items-center gap-1 border-t border-border px-4 py-2 sm:px-6"
    >
      {links.map(({ href, title, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-ring aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          {title}
        </Link>
      ))}
    </nav>
  );
}
