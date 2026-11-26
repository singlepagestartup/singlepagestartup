"use client";

import { Button, settingsFormStyles } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IStoreCatalogDirectoryItem } from "@sps/rbac/models/subject/sdk/model";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { storeProductHref } from "../../paths";
import { newPriceChanges, PriceFields } from "../edit/PriceFields";
import {
  ProductTranslations,
  type TProductTranslations,
} from "../edit/ProductTranslations";
import { ProductDirectoryField } from "./ProductDirectoryField";
import { ProductPhotos } from "../ProductPhotos";

interface IProductFormProps {
  subjectId: string;
  ecommerceModuleStore: IEcommerceModuleStore;
  language: string;
}

const blankProduct = { title: null, shortDescription: null, description: null };

export function ProductForm({
  subjectId,
  ecommerceModuleStore,
  language,
}: IProductFormProps) {
  const ru = language === "ru";
  const router = useRouter();
  const storeId = ecommerceModuleStore.id;
  const options = api.crmWorkspace.useOptions(subjectId, storeId);
  const create = api.ecommerceModuleOfferCreate();
  const [texts, setTexts] = useState<TProductTranslations>({});
  const [titleError, setTitleError] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"service" | "physical">("service");
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>();
  const [categories, setCategories] = useState<IStoreCatalogDirectoryItem[]>(
    [],
  );
  const [attributes, setAttributes] = useState<IStoreCatalogDirectoryItem[]>(
    [],
  );
  const [images, setImages] = useState<File[]>([]);
  const [failure, setFailure] = useState("");
  const submitting = useRef(false);
  const [created, setCreated] = useState(false);
  const currencies = options.data?.currencies ?? [];
  const firstCurrency = currencies[0];
  const amounts =
    priceDraft ?? (firstCurrency ? { [firstCurrency.id]: "" } : {});
  const prices = newPriceChanges(amounts, []);
  const heading = ru ? "Цены" : "Prices";

  function localized(field: "title" | "shortDescription" | "description") {
    const result: Record<string, string> = {};
    for (const [locale, translation] of Object.entries(texts)) {
      const value = translation[field]?.trim();
      if (value) result[locale] = value;
    }
    return result;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !subjectId || !prices.length || options.isError)
      return;
    const title = localized("title");
    const adminTitle = title[language] || Object.values(title)[0];
    if (!adminTitle) {
      setTitleError(true);
      titleInput.current?.focus();
      return;
    }
    submitting.current = true;
    setFailure("");
    try {
      const { product } = await create.mutateAsync({
        id: subjectId,
        images,
        data: {
          storeId,
          product: {
            title,
            adminTitle,
            shortDescription: localized("shortDescription"),
            description: localized("description"),
            kind,
            type: "one_off",
            singleUnitPerOrder: kind === "service",
            formula: "unit_price * quantity",
          },
          prices,
          categoryIds: categories.map(({ id }) => id),
          attributeIds: attributes.map(({ id }) => id),
          settings: {
            standalone: true,
            requiresResultAcceptance: kind === "service",
          },
        },
      });
      setCreated(true);
      router.push(
        storeProductHref(language, ecommerceModuleStore.slug, product.id),
      );
    } catch (error) {
      submitting.current = false;
      setFailure(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось добавить товар."
            : "Could not add the product.",
      );
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset
        className="grid min-w-0 gap-4"
        disabled={create.isPending || created}
      >
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <ProductTranslations
            disabled={create.isPending || created}
            product={blankProduct}
            language={language}
            drafts={texts}
            titleError={titleError}
            titleInputRef={titleInput}
            onChange={(locale, field, value) => {
              if (field === "title") setTitleError(false);
              setTexts((before) => ({
                ...before,
                [locale]: { ...before[locale], [field]: value },
              }));
            }}
          />
          <div className="grid min-w-0 gap-4">
            <section className={`${settingsFormStyles.panel} grid gap-5`}>
              <label className={settingsFormStyles.label}>
                {ru ? "Тип товара" : "Product type"}
                <Select
                  ui="shadcn"
                  aria-label={ru ? "Тип товара" : "Product type"}
                  className={settingsFormStyles.field}
                  value={kind}
                  onValueChange={(value) =>
                    setKind(value === "physical" ? "physical" : "service")
                  }
                  options={[
                    {
                      value: "service",
                      label: ru
                        ? "Услуга с оплатой после приёмки"
                        : "Service paid after acceptance",
                    },
                    {
                      value: "physical",
                      label: ru ? "Физический товар" : "Physical product",
                    },
                  ]}
                />
              </label>
              <h2 className={settingsFormStyles.title}>{heading}</h2>
              {options.isError ? (
                <div className="grid justify-items-start gap-2">
                  <p role="alert" className="text-sm text-destructive">
                    {ru
                      ? "Не удалось загрузить валюты."
                      : "Could not load currencies."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void options.refetch()}
                  >
                    {ru ? "Повторить" : "Retry"}
                  </Button>
                </div>
              ) : options.isPending ? (
                <p role="status" className="text-sm text-muted-foreground">
                  {ru ? "Загрузка валют…" : "Loading currencies…"}
                </p>
              ) : currencies.length ? (
                <PriceFields
                  language={language}
                  heading={heading}
                  ownerId={storeId}
                  prices={[]}
                  values={{}}
                  newValues={amounts}
                  currencies={currencies
                    .filter(
                      ({ id }) =>
                        prices.length < 20 || amounts[id] !== undefined,
                    )
                    .map(({ id, title }) => ({ id, title, symbol: "" }))}
                  onChange={() => {}}
                  onNewPriceChange={(_ownerId, currencyId, value) => {
                    const next = { ...amounts };
                    if (value === undefined) delete next[currencyId];
                    else next[currencyId] = value;
                    setPriceDraft(next);
                  }}
                />
              ) : (
                <p role="status" className="text-sm text-muted-foreground">
                  {ru ? "Нет доступных валют." : "No currencies available."}
                </p>
              )}
            </section>
            <section className={`${settingsFormStyles.panel} grid gap-5`}>
              <h2 className={settingsFormStyles.title}>
                {ru ? "Каталог" : "Catalogue"}
              </h2>
              <ProductDirectoryField
                kind="categories"
                subjectId={subjectId}
                storeId={storeId}
                language={language}
                selected={categories}
                onChange={setCategories}
              />
              <ProductDirectoryField
                kind="attributes"
                subjectId={subjectId}
                storeId={storeId}
                language={language}
                selected={attributes}
                onChange={setAttributes}
              />
            </section>
          </div>
        </div>
        <section className={`${settingsFormStyles.panel} grid gap-4`}>
          <h2 className={settingsFormStyles.title}>
            {ru ? "Фотографии" : "Photos"}
          </h2>
          <ProductPhotos
            language={language}
            files={images}
            onChange={setImages}
            disabled={create.isPending || created}
          />
        </section>
        {failure && (
          <p role="alert" className="text-sm text-destructive">
            {failure}
          </p>
        )}
        <Button
          type="submit"
          className={`${settingsFormStyles.primary} justify-self-end`}
          disabled={
            create.isPending ||
            created ||
            options.isError ||
            !firstCurrency ||
            !prices.length
          }
        >
          {create.isPending
            ? ru
              ? "Сохранение…"
              : "Saving…"
            : ru
              ? "Сохранить товар"
              : "Save product"}
        </Button>
      </fieldset>
    </form>
  );
}
