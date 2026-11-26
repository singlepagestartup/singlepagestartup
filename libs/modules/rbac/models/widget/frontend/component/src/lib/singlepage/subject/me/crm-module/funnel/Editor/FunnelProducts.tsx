import Link from "next/link";
import { FUNNEL_PRODUCT_LIMIT } from "@sps/crm/models/funnel/sdk/model/src/lib/workflow";
import { ArrowUpRight } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceProduct } from "@sps/rbac/models/subject/sdk/model";
import {
  SearchMultiSelect,
  type ISearchSelectQuery,
} from "@sps/shared-ui-shadcn/select";
import { storeProductHref } from "../../../ecommerce-module/store/paths";

interface IFunnelProductsProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
  selected: ICrmWorkspaceProduct[];
  disabled: boolean;
  onChange: (items: ICrmWorkspaceProduct[]) => void;
}

export function FunnelProducts({
  subjectId,
  storeId,
  storeSlug,
  language,
  selected,
  disabled,
  onChange,
}: IFunnelProductsProps) {
  const ru = language === "ru";
  const selectedById = new Map(
    selected.map((product) => [product.id, product]),
  );
  const label = (product: ICrmWorkspaceProduct) =>
    product.localizedTitle?.[language] ||
    product.title ||
    `${ru ? "Недоступный товар" : "Unavailable product"} · ${product.id.slice(0, 8)}`;
  function useProducts({ search, offset, limit }: ISearchSelectQuery) {
    const page = api.crmWorkspace.useFunnelProducts({
      id: subjectId,
      params: {
        storeId,
        language: ru ? "ru" : "en",
        offset,
        limit,
        search: search || undefined,
      },
    });
    return {
      items: (page.data?.items ?? []).map((product) => ({
        id: product.id,
        label: label(product),
      })),
      total: page.data?.total,
      loading: page.isPending,
      error: page.isError,
      retry: page.refetch,
    };
  }
  return (
    <SearchMultiSelect
      language={language}
      label={ru ? "Выбрать товары" : "Select products"}
      searchLabel={ru ? "Поиск по названию товара" : "Search by product name"}
      selected={selected.map((product) => ({
        id: product.id,
        label: label(product),
      }))}
      disabled={disabled}
      maxSelected={FUNNEL_PRODUCT_LIMIT}
      onChange={(items) =>
        onChange(
          items.map(
            ({ id, label: title }) => selectedById.get(id) ?? { id, title },
          ),
        )
      }
      renderSelected={({ id, label }) =>
        selectedById.get(id)?.title ? (
          <Link
            className="inline-flex min-w-0 items-center gap-1 py-1.5 text-foreground underline underline-offset-2 hover:decoration-2"
            href={storeProductHref(language, storeSlug, id)}
            aria-label={
              ru ? `Открыть товар «${label}»` : `Open product “${label}”`
            }
          >
            <span className="min-w-0 break-words">{label}</span>
            <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </Link>
        ) : (
          <span className="min-w-0 break-words py-1.5">{label}</span>
        )
      }
      usePage={useProducts}
    />
  );
}
