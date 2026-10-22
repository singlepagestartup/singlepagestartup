"use client";
import type {
  IComponentProps,
  ProductFindCategory,
  ProductFindProduct,
  ProductFindCardProps,
} from "./interface";
export type {
  ProductFindCategory,
  ProductFindProduct,
  ProductFindCardProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  useId,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { defaultProductCardProps } from "../../../product";
import { memo } from "react";
import { Component as Product } from "../../../product/index";
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

export function Component(props: IComponentProps) {
  const { categories = [], products = [] } = {
    ...props,
  };
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const chooseCategory = useCallback((value: string) => {
    setCategory(value);
    setPage(1);
  }, []);
  const search = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "all" || product.category === category) &&
          `${product.title} ${product.subtitle} ${product.shortDescription} ${product.techStack.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [products, category, query],
  );
  const activePage = Math.min(
    page,
    Math.max(1, Math.ceil(visibleProducts.length / pageSize)),
  );
  const pageProducts = visibleProducts.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <div
      className={
        props.embedded
          ? "min-w-0 w-full"
          : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      }
      data-ds-block="ecommerce.widget.product-find-card"
      data-ds-imports="ecommerce.product.card"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="widget"
      data-variant={props?.variant ?? "product-find-card"}
    >
      {props?.title ? (
        <header className="mb-6 space-y-3">
          <h2 className="text-3xl font-semibold">{props.title}</h2>
          {props.description}
        </header>
      ) : (
        props?.description
      )}
      <CollectionToolbar
        categories={categories}
        category={category}
        onCategoryChange={chooseCategory}
        query={query}
        onQueryChange={search}
        searchLabel="Search services"
      />
      <p role="status" className="mb-6 text-sm text-muted-foreground">
        {visibleProducts.length}{" "}
        {visibleProducts.length === 1 ? "service" : "services"}
      </p>
      {visibleProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageProducts.map((product) => (
            <ProductCardRow key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold">No services found</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Try another search or category.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
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
        total={visibleProducts.length}
        onPageChange={setPage}
      />
    </div>
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
const ProductCardRow = memo(function ProductCardRow({
  product,
}: {
  product: ProductFindProduct;
}) {
  return (
    <Product
      {...product}
      variant="card"
      href={product.href ?? productOverviewStoryHref}
      target="_top"
    />
  );
});

const productOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-ecommerce-module-product-slug--default";
