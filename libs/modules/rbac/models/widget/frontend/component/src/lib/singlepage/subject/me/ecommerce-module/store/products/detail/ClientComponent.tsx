"use client";

import { TipTapContent } from "@sps/shared-ui-shadcn/tiptap/content";

import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { OrderColumns } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/store-list-row/Columns";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreProductDetail,
  IStoreProductFunnel,
} from "@sps/rbac/models/subject/sdk/model";
import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import {
  secondaryClass,
  storeList,
} from "../../../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import {
  storeOrderHref,
  storeProductEditHref,
  storeSectionHref,
} from "../../paths";
import { StoreSection } from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import type { IProductPageProps } from "../interface";
import { ProductStatus } from "../ProductStatus";
import {
  localizedText,
  offerVariantLabel,
  priceIdentifier,
  priceLabel,
  productKind,
  productName,
} from "../view-model";

function ProductDetails({
  data,
  language,
  storeSlug,
}: {
  data: IStoreProductDetail;
  language: string;
  storeSlug: string;
}) {
  const ru = language === "ru";
  const { product, offers, productPrices } = data;
  const short = localizedText(product.shortDescription, language);
  const description = localizedText(product.description, language);
  const canEdit =
    data.canEditProduct || offers.some(({ editable }) => editable);
  return (
    <section className={storeList.panel} aria-labelledby="store-product-title">
      <header className={storeList.heading}>
        <div className="grid min-w-0 gap-1">
          <h1
            id="store-product-title"
            className={`${storeList.title} wrap-anywhere`}
          >
            {productName(product, language)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {productKind(product.kind, ru)}
            {" · "}
            {product.type === "subscription"
              ? ru
                ? "Подписка"
                : "Subscription"
              : ru
                ? "Разовая покупка"
                : "One-time purchase"}
          </p>
        </div>
        {canEdit && (
          <Link
            href={storeProductEditHref(language, storeSlug, product.id)}
            className={secondaryClass}
          >
            <Pencil aria-hidden="true" className="size-4" />
            {ru ? "Редактировать" : "Edit product"}
          </Link>
        )}
      </header>
      {(short || description) && (
        <div className="grid max-w-prose gap-2 text-sm">
          {short && (
            <p className="whitespace-pre-wrap break-words font-medium">
              {short}
            </p>
          )}
          {description && description !== short && (
            <TipTapContent
              value={description}
              className="mx-0 whitespace-pre-wrap break-words text-sm text-muted-foreground"
            />
          )}
        </div>
      )}
      <section className="grid gap-3" aria-labelledby="product-offers-title">
        <h2 id="product-offers-title" className="text-lg font-semibold">
          {ru ? "Предложения магазина" : "Store offers"}
        </h2>
        <ul className="grid gap-2">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="grid gap-2 rounded-xl border border-border bg-card p-3 text-sm sm:grid-cols-[1fr_auto]"
            >
              <div className="grid min-w-0 gap-1">
                <p className="font-medium">
                  {offerVariantLabel(offer.variant, ru)}
                </p>
                <p className="break-all text-muted-foreground">
                  {ru ? "Артикул" : "SKU"}{" "}
                  <span className="text-foreground">{offer.sku}</span>
                </p>
                {offer.configurationKey && (
                  <p className="break-words text-muted-foreground">
                    {offer.configurationKey}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-2 font-medium tabular-nums">
                {offer.prices.length ? (
                  offer.prices.map((price) => (
                    <span
                      key={priceIdentifier(price)}
                      title={price.currencyTitle}
                      className="rounded-md bg-muted px-2 py-1"
                    >
                      {priceLabel(price, language)}
                    </span>
                  ))
                ) : (
                  <span className="font-normal text-muted-foreground">
                    {ru ? "Цена предложения не задана" : "No offer price set"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {productPrices.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
            <span className="text-muted-foreground">
              {ru ? "Цены товара" : "Product prices"}
            </span>
            {productPrices.map((price) => (
              <span
                key={priceIdentifier(price)}
                title={price.currencyTitle}
                className="rounded-md bg-muted px-2 py-1 font-medium tabular-nums"
              >
                {priceLabel(price, language)}
              </span>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

const FunnelRow = memo(function FunnelRow({
  funnel,
  language,
  storeSlug,
}: {
  funnel: IStoreProductFunnel;
  language: string;
  storeSlug: string;
}) {
  return (
    <li className="min-w-0">
      <Link
        className={`${storeList.row} flex min-h-12 items-center justify-between gap-4 px-4 py-3 text-sm font-semibold`}
        href={`${storeSectionHref(language, storeSlug, "funnels")}/${encodeURIComponent(funnel.slug)}`}
      >
        <span className="min-w-0 break-words">{funnel.title}</span>
        <ChevronRight aria-hidden="true" className={storeList.arrow} />
      </Link>
    </li>
  );
});

function ProductDetail({
  subjectId,
  storeId,
  storeSlug,
  productId,
  language,
}: {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  productId: string;
  language: string;
}) {
  const ru = language === "ru";
  const [offset, setOffset] = useState(0);
  const reading = api.storeProducts.useDetail(
    subjectId,
    storeId,
    productId,
    offset,
  );
  const showOrders = Boolean(reading.data?.orders);
  useEffect(() => {
    if (showOrders && window.location.hash === "#product-orders-title") {
      const heading = document.getElementById("product-orders-title");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({ block: "start" });
    }
  }, [showOrders]);
  if (!reading.data || hasStatus(reading.error, 401, 403, 404)) {
    return (
      <ProductStatus
        language={language}
        isPending={reading.isPending}
        error={reading.error}
        retry={() => void reading.refetch()}
      />
    );
  }
  const { funnels, orders } = reading.data;
  return (
    <div className="grid min-w-0 gap-6">
      <ProductDetails
        data={reading.data}
        language={language}
        storeSlug={storeSlug}
      />
      {funnels && (
        <section
          className={storeList.panel}
          aria-labelledby="product-funnels-title"
        >
          <h2 id="product-funnels-title" className="text-lg font-semibold">
            {ru ? "Воронки с этим товаром" : "Funnels with this product"}
          </h2>
          {funnels.length ? (
            <ul className="grid gap-2">
              {funnels.map((funnel) => (
                <FunnelRow
                  key={funnel.id}
                  funnel={funnel}
                  language={language}
                  storeSlug={storeSlug}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ru ? "Связанных воронок нет." : "No linked funnels."}
            </p>
          )}
        </section>
      )}
      {orders && (
        <section
          className={storeList.panel}
          aria-labelledby="product-orders-title"
        >
          <h2
            id="product-orders-title"
            tabIndex={-1}
            className="scroll-mt-20 text-lg font-semibold"
          >
            {ru ? "Заказы с этим товаром" : "Orders with this product"}
          </h2>
          {orders.items.length ? (
            <div className="grid min-w-0 gap-2">
              <OrderColumns language={language} quantity />
              <ul className="grid gap-2" aria-labelledby="product-orders-title">
                {orders.items.map((order) => (
                  <EcommerceModuleOrder
                    key={order.id}
                    data={order}
                    quantity={order.quantity}
                    language={language}
                    isServer={false}
                    dataSource="props"
                    variant="store-list-row"
                    href={storeOrderHref(language, storeSlug, order.id)}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ru ? "Заказов пока нет." : "No orders yet."}
            </p>
          )}
          {(offset > 0 || orders.nextOffset !== undefined) && (
            <nav
              className="flex flex-wrap gap-2"
              aria-label={ru ? "Страницы заказов" : "Order pages"}
            >
              <button
                type="button"
                className={secondaryClass}
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 20))}
              >
                {ru ? "Предыдущая страница" : "Previous page"}
              </button>
              <button
                type="button"
                className={secondaryClass}
                disabled={orders.nextOffset === undefined}
                onClick={() => {
                  if (orders.nextOffset !== undefined)
                    setOffset(orders.nextOffset);
                }}
              >
                {ru ? "Следующая страница" : "Next page"}
              </button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  ecommerceModuleProductId,
  language,
}: IProductPageProps) {
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="products"
    >
      {(session) =>
        session.access ? (
          <ProductDetail
            key={`${session.access.subjectId}:${ecommerceModuleStore.id}:${ecommerceModuleProductId}`}
            subjectId={session.access.subjectId}
            storeId={ecommerceModuleStore.id}
            storeSlug={ecommerceModuleStore.slug}
            productId={ecommerceModuleProductId}
            language={language}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={
              language === "ru"
                ? "У вас нет доступа к товарам этого магазина."
                : "You do not have access to this store's products."
            }
          />
        )
      }
    </StoreSection>
  );
}
