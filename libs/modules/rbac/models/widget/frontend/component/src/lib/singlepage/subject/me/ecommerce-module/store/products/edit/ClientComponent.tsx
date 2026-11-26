"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreProductDetail,
  IStoreProductPrice,
  IStoreProductUpdate,
} from "@sps/rbac/models/subject/sdk/model";
import {
  settingsFormStyles,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { hasStatus } from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeProductHref } from "../../paths";
import { StoreSection } from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import type { IProductPageProps } from "../interface";
import { ProductStatus } from "../ProductStatus";
import { offerVariantLabel, productName } from "../view-model";
import {
  newPriceChanges,
  priceChanges,
  priceFieldKey,
  PriceFields,
} from "./PriceFields";
import { ProductRelations } from "./ProductRelations";
import {
  ProductTranslations,
  translationChanges,
  type TProductTranslations,
} from "./ProductTranslations";

interface IProductEditFormProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
  data: IStoreProductDetail;
  reload: () => Promise<IStoreProductDetail | undefined>;
}

interface IPriceRemoval {
  owner: "product" | "offer";
  offerId?: string;
  price: IStoreProductPrice;
}

function ProductEditForm({
  subjectId,
  storeId,
  storeSlug,
  language,
  data,
  reload,
}: IProductEditFormProps) {
  const ru = language === "ru";
  const update = api.storeProducts.useUpdate();
  const [tab, setTab] = useState("details");
  const [relationsBusy, setRelationsBusy] = useState(false);
  const [draftBase, setDraftBase] = useState<IStoreProductDetail>();
  const [translations, setTranslations] = useState<TProductTranslations>({});
  const [selectedOfferId, setSelectedOfferId] = useState<string>();
  const [skuValues, setSkuValues] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [newAmounts, setNewAmounts] = useState<
    Record<string, Record<string, string>>
  >({});
  const [remove, setRemove] = useState<IPriceRemoval>();
  const removeTrigger = useRef<HTMLElement | null>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [validateTitle, setValidateTitle] = useState(false);
  const baseline = draftBase ?? data;
  const { product, offers } = baseline;
  const productPrices = data.canEditProduct
    ? baseline.productPrices
    : baseline.productPrices.map((price) => ({ ...price, editable: false }));
  const offer =
    offers.find(({ id }) => id === selectedOfferId) ??
    offers.find(({ editable }) => editable) ??
    offers[0];
  const sku = offer ? (skuValues[offer.id] ?? offer.sku) : "";
  const localizedChanges = data.canEditProduct
    ? translationChanges(product, translations)
    : {};
  const localizedChanged = Object.keys(localizedChanges).length > 0;
  const changedTitles = Object.entries(localizedChanges).flatMap(
    ([locale, { title }]) =>
      title === undefined ? [] : [[locale, title] as const],
  );
  const missingTitle =
    changedTitles.length > 0 &&
    !Object.values({
      ...product.title,
      ...Object.fromEntries(changedTitles),
    }).some((title) => title?.trim());
  const inheritedPrices = priceChanges(product.id, productPrices, amounts);
  const productNewPrices = data.canEditProduct
    ? newPriceChanges(newAmounts[product.id], productPrices)
    : [];
  const offerPrices = offer
    ? priceChanges(offer.id, offer.prices, amounts)
    : [];
  const offerNewPrices = offer
    ? newPriceChanges(newAmounts[offer.id], offer.prices)
    : [];
  const skuChanged = Boolean(offer?.editable && sku.trim() !== offer.sku);
  const offerDirty =
    skuChanged || offerPrices.length > 0 || offerNewPrices.length > 0;
  const dirty =
    localizedChanged ||
    inheritedPrices.length > 0 ||
    productNewPrices.length > 0 ||
    offerDirty;
  const catalogCurrencies = data.relations?.currencyOptions;
  const conflict = hasStatus(update.error, 409);
  const productPricesTitle = ru ? "Цены товара" : "Product prices";
  const offerTitle = ru ? "Предложение магазина" : "Store offer";
  const resetDrafts = useCallback(() => {
    setTranslations({});
    setSkuValues({});
    setAmounts({});
    setNewAmounts({});
    setDraftBase(undefined);
    setValidateTitle(false);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (draftBase && !dirty && !update.isPending && !refreshing) {
      resetDrafts();
    }
  }, [dirty, draftBase, refreshing, resetDrafts, update.isPending]);

  function editDraft() {
    setDraftBase((previous) => previous ?? data);
    setSaved(false);
  }

  function changeAmount(key: string, value: string) {
    editDraft();
    setAmounts((previous) => ({ ...previous, [key]: value }));
  }

  function changeNewAmount(
    ownerId: string,
    currencyId: string,
    value: string | undefined,
  ) {
    editDraft();
    setNewAmounts((previous) => {
      const owner = { ...previous[ownerId] };
      if (value === undefined) {
        delete owner[currencyId];
      } else {
        owner[currencyId] = value;
      }
      return { ...previous, [ownerId]: owner };
    });
  }

  function resetOfferDraft(id: string) {
    setSkuValues(({ [id]: _sku, ...remaining }) => remaining);
    setNewAmounts(({ [id]: _amount, ...remaining }) => remaining);
    setAmounts((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([key]) => !key.startsWith(`${id}:`)),
      ),
    );
    if (
      !localizedChanged &&
      !inheritedPrices.length &&
      !productNewPrices.length
    )
      setDraftBase(undefined);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || update.isPending || refreshing || conflict) return;
    if (missingTitle) {
      setValidateTitle(true);
      titleInput.current?.focus();
      return;
    }
    const changes: IStoreProductUpdate = {};
    if (localizedChanged) {
      changes.translations = {
        expectedUpdatedAt: product.updatedAt,
        entries: localizedChanges,
      };
    }
    if (inheritedPrices.length) changes.productPrices = inheritedPrices;
    if (productNewPrices.length) changes.productNewPrices = productNewPrices;
    if (offer?.editable && offerDirty) {
      changes.offer = {
        id: offer.id,
        prices: offerPrices,
        ...(offerNewPrices.length && { newPrices: offerNewPrices }),
        sku: skuChanged
          ? { expected: offer.sku, value: sku.trim() }
          : undefined,
      };
    }
    update.mutate(
      { id: subjectId, storeId, productId: product.id, data: changes },
      {
        onSuccess() {
          resetDrafts();
          setRefreshError(false);
          setSaved(true);
        },
      },
    );
  }

  async function refresh() {
    setRefreshing(true);
    setRefreshError(false);
    try {
      const latest = await reload();
      if (!latest) {
        setRefreshError(true);
        return;
      }
      setTranslations(localizedChanges);
      setDraftBase(latest);
      update.reset();
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }

  function confirmPriceRemoval(removal: IPriceRemoval) {
    const active = document.activeElement;
    removeTrigger.current = active instanceof HTMLElement ? active : null;
    setRemove(removal);
  }

  function removePrice() {
    if (!remove || update.isPending || refreshing) return;
    const { owner, offerId, price } = remove;
    const ownerId = offerId ?? product.id;
    update.mutate(
      {
        id: subjectId,
        storeId,
        productId: product.id,
        data: {
          relation: {
            kind: "remove-price",
            owner,
            ...(offerId && { offerId }),
            attributeId: price.attributeId,
            currencyId: price.currencyId,
            expectedAmount: price.amount,
          },
        },
      },
      {
        onSuccess() {
          const removeSelected = (prices: IStoreProductPrice[]) =>
            prices.filter(
              (row) =>
                priceFieldKey(ownerId, row) !== priceFieldKey(ownerId, price),
            );
          setDraftBase(
            (previous) =>
              previous &&
              (owner === "product"
                ? {
                    ...previous,
                    productPrices: removeSelected(previous.productPrices),
                  }
                : {
                    ...previous,
                    offers: previous.offers.map((offer) =>
                      offer.id === offerId
                        ? { ...offer, prices: removeSelected(offer.prices) }
                        : offer,
                    ),
                  }),
          );
          setAmounts(
            ({ [priceFieldKey(ownerId, price)]: _amount, ...remaining }) =>
              remaining,
          );
          setSaved(!dirty);
        },
      },
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-4">
      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <header
          className={`${settingsFormStyles.panel} grid justify-items-start gap-3`}
        >
          <h1
            ref={editorHeading}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight"
          >
            {ru ? "Редактирование товара" : "Edit product"}
          </h1>
          <Link
            href={storeProductHref(language, storeSlug, product.id)}
            className="w-fit break-words text-sm text-muted-foreground underline underline-offset-4"
          >
            {productName(data.product, language)}
          </Link>

          {data.relations && (
            <TabsList
              aria-label={
                ru ? "Разделы редактирования" : "Product editor sections"
              }
              className="h-auto max-w-full flex-wrap justify-start"
            >
              <TabsTrigger value="details" disabled={relationsBusy}>
                {ru ? "Карточка и цены" : "Details and prices"}
              </TabsTrigger>
              <TabsTrigger
                value="relations"
                disabled={update.isPending || refreshing}
              >
                {ru ? "Связи" : "Relations"}
              </TabsTrigger>
            </TabsList>
          )}
        </header>
        <TabsContent
          value="details"
          forceMount
          hidden={tab !== "details"}
          className="mt-4"
        >
          <form onSubmit={submit} className="grid min-w-0 gap-4">
            <fieldset
              disabled={update.isPending || refreshing}
              className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
            >
              {data.canEditProduct ? (
                <ProductTranslations
                  disabled={update.isPending || refreshing}
                  product={product}
                  language={language}
                  drafts={translations}
                  titleError={validateTitle && missingTitle}
                  titleInputRef={titleInput}
                  onChange={(locale, field, value) => {
                    editDraft();
                    setTranslations((previous) => ({
                      ...previous,
                      [locale]: { ...previous[locale], [field]: value },
                    }));
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {data.sharedProduct
                    ? ru
                      ? "Этот товар используется в нескольких магазинах. Здесь доступны настройки предложений вашего магазина."
                      : "Several stores use this product. You can edit your store's offers here."
                    : ru
                      ? "Название и описание доступны владельцу товара."
                      : "The product owner can edit its name and description."}
                </p>
              )}
              <div className="grid min-w-0 gap-4">
                {(data.canEditProduct || productPrices.length > 0) && (
                  <section
                    className={`${settingsFormStyles.panel} grid gap-5`}
                    aria-labelledby="edit-product-prices"
                  >
                    <h2
                      id="edit-product-prices"
                      className={settingsFormStyles.title}
                    >
                      {productPricesTitle}
                    </h2>
                    <PriceFields
                      language={language}
                      heading={productPricesTitle}
                      ownerId={product.id}
                      prices={productPrices}
                      values={amounts}
                      newValues={
                        data.canEditProduct ? newAmounts[product.id] : undefined
                      }
                      currencies={
                        data.canEditProduct ? catalogCurrencies : undefined
                      }
                      onChange={changeAmount}
                      onNewPriceChange={changeNewAmount}
                      onRemove={
                        data.canEditProduct
                          ? (price) =>
                              confirmPriceRemoval({ owner: "product", price })
                          : undefined
                      }
                    />
                  </section>
                )}
                {offer && (
                  <section
                    className={`${settingsFormStyles.panel} grid gap-5`}
                    aria-labelledby="edit-offer-title"
                  >
                    <h2
                      id="edit-offer-title"
                      className={settingsFormStyles.title}
                    >
                      {offerTitle}
                    </h2>
                    {offers.length > 1 && (
                      <div className="grid min-w-0 gap-2 text-sm">
                        <label
                          htmlFor="edit-offer-picker"
                          className={settingsFormStyles.label}
                        >
                          {ru ? "Предложение" : "Offer"}
                        </label>
                        <Select
                          className={settingsFormStyles.field}
                          ui="shadcn"
                          id="edit-offer-picker"
                          aria-label={ru ? "Предложение" : "Offer"}
                          value={offer.id}
                          disabled={offerDirty || update.isPending}
                          onValueChange={(id) => {
                            if (!offerDirty) setSelectedOfferId(id);
                          }}
                          options={offers.map((item) => ({
                            value: item.id,
                            label: `${item.configurationKey || offerVariantLabel(item.variant, ru)} · ${item.sku}`,
                          }))}
                        />
                        {offerDirty && (
                          <Button
                            type="button"
                            variant="outline"
                            className={`${settingsFormStyles.secondary} w-fit`}
                            onClick={() => resetOfferDraft(offer.id)}
                          >
                            {ru
                              ? "Сбросить изменения предложения"
                              : "Reset offer changes"}
                          </Button>
                        )}
                      </div>
                    )}
                    <label className={settingsFormStyles.label}>
                      {ru ? "Артикул" : "SKU"}
                      <Input
                        className={settingsFormStyles.field}
                        required
                        maxLength={200}
                        readOnly={!offer.editable}
                        value={sku}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          editDraft();
                          setSkuValues((previous) => ({
                            ...previous,
                            [offer.id]: value,
                          }));
                        }}
                      />
                    </label>
                    <PriceFields
                      language={language}
                      heading={offerTitle}
                      ownerId={offer.id}
                      prices={offer.prices}
                      values={amounts}
                      newValues={newAmounts[offer.id]}
                      currencies={
                        offer.editable ? catalogCurrencies : undefined
                      }
                      onChange={changeAmount}
                      onNewPriceChange={changeNewAmount}
                      onRemove={
                        offer.editable
                          ? (price) =>
                              confirmPriceRemoval({
                                owner: "offer",
                                offerId: offer.id,
                                price,
                              })
                          : undefined
                      }
                    />
                  </section>
                )}
              </div>
            </fieldset>
            {update.isError && (
              <div className="grid gap-2">
                <p role="alert" className="text-sm text-destructive">
                  {conflict
                    ? ru
                      ? "Данные изменились или артикул уже занят."
                      : "The data changed or the SKU is already in use."
                    : ru
                      ? "Не удалось сохранить изменения."
                      : "Could not save the changes."}
                </p>
                {conflict && (
                  <Button
                    type="button"
                    variant="outline"
                    className={`${settingsFormStyles.secondary} w-fit`}
                    disabled={refreshing}
                    onClick={() => void refresh()}
                  >
                    {ru ? "Загрузить актуальные данные" : "Reload current data"}
                  </Button>
                )}
              </div>
            )}
            {refreshError && (
              <p role="alert" className="text-sm text-destructive">
                {ru
                  ? "Не удалось загрузить актуальные данные."
                  : "Could not reload current data."}
              </p>
            )}
            <div className={settingsFormStyles.actions}>
              <Button
                className={`${settingsFormStyles.primary} w-fit`}
                type="submit"
                disabled={!dirty || update.isPending || refreshing || conflict}
              >
                {update.isPending
                  ? ru
                    ? "Сохраняем…"
                    : "Saving…"
                  : ru
                    ? "Сохранить изменения"
                    : "Save changes"}
              </Button>
              {saved && (
                <p role="status" className="text-sm">
                  {ru ? "Изменения сохранены." : "Changes saved."}
                </p>
              )}
            </div>
          </form>
        </TabsContent>
        {data.relations && (
          <TabsContent
            value="relations"
            forceMount
            hidden={tab !== "relations"}
            className="mt-4"
          >
            <ProductRelations
              offers={offers}
              selectedOfferId={offer?.id}
              onOfferChange={setSelectedOfferId}
              offerLocked={offerDirty || update.isPending}
              subjectId={subjectId}
              storeId={storeId}
              productId={product.id}
              language={language}
              editable={data.canEditProduct}
              relations={data.relations}
              onRefresh={async () => Boolean(await reload())}
              onPendingChange={setRelationsBusy}
            />
          </TabsContent>
        )}
      </Tabs>
      <AlertDialog
        open={Boolean(remove)}
        onOpenChange={(open) => {
          if (!open) setRemove(undefined);
        }}
      >
        <AlertDialogContent
          className={`${settingsFormStyles.panel} w-[calc(100%-2rem)] sm:rounded-2xl`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const focused = removeTrigger.current;
            (focused?.isConnected && !focused.matches(":disabled")
              ? focused
              : editorHeading.current
            )?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={settingsFormStyles.title}>
              {ru ? "Удалить цену?" : "Remove this price?"}
            </AlertDialogTitle>
            <AlertDialogDescription className={settingsFormStyles.description}>
              {remove?.price.currencyTitle} {remove?.price.currencySymbol}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:space-x-0">
            <AlertDialogCancel
              className={`${settingsFormStyles.secondary} mt-0 sm:w-fit`}
            >
              {ru ? "Отмена" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${settingsFormStyles.button} border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-fit`}
              onClick={removePrice}
            >
              {ru ? "Удалить цену" : "Remove price"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductEdit({
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
  const reading = api.storeProducts.useDetail(subjectId, storeId, productId);
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
  if (
    !reading.data.canEditProduct &&
    !reading.data.offers.some(({ editable }) => editable)
  ) {
    return (
      <p role="alert">
        {language === "ru"
          ? "У вас нет права редактировать этот товар."
          : "You do not have permission to edit this product."}
      </p>
    );
  }
  return (
    <ProductEditForm
      data={reading.data}
      language={language}
      subjectId={subjectId}
      storeId={storeId}
      storeSlug={storeSlug}
      reload={async () => {
        const refreshed = await reading.refetch();
        return refreshed.isSuccess ? refreshed.data : undefined;
      }}
    />
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
        session.access?.store.canManageCatalog ? (
          <ProductEdit
            key={`${session.access.subjectId}:${ecommerceModuleStore.id}:${ecommerceModuleProductId}:${language}`}
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
                ? "У вас нет права редактировать товары этого магазина."
                : "You do not have permission to edit this store's products."
            }
          />
        )
      }
    </StoreSection>
  );
}
