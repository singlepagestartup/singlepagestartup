"use client";

import { Select } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { PackagePlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  primaryClass,
  secondaryClass,
  fieldClass,
} from "../subject-me-crm-module-store-workspace/primitives";

interface IStoreProductsProps {
  subjectId?: string;
  ecommerceModuleStore: IEcommerceModuleStore;
  language: string;
}

export function StoreProducts({
  subjectId,
  ecommerceModuleStore,
  language,
}: IStoreProductsProps) {
  const ru = language === "ru";
  const storeId = ecommerceModuleStore.id;
  const options = api.crmWorkspace.useOptions(
    subjectId ?? "",
    subjectId ? storeId : undefined,
  );
  const create = api.ecommerceModuleOfferCreate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"service" | "physical">("service");
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [description, setDescription] = useState("");
  const [failure, setFailure] = useState("");
  const [created, setCreated] = useState("");
  const currency = currencyId || options.data?.currencies[0]?.id;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subjectId || !title.trim() || !currency || create.isPending) return;
    setFailure("");
    setCreated("");
    try {
      await create.mutateAsync({
        id: subjectId,
        data: {
          storeId,
          product: {
            title: { [language]: title.trim() },
            adminTitle: title.trim(),
            shortDescription: { [language]: description.trim() },
            kind,
            type: "one_off",
            singleUnitPerOrder: kind === "service",
            formula: "unit_price * quantity",
          },
          prices: [
            { currencyId: currency, amount: amount.trim().replace(",", ".") },
          ],
          settings: {
            standalone: true,
            requiresResultAcceptance: kind === "service",
          },
        },
      });
      setCreated(title.trim());
      setTitle("");
      setAmount("");
      setDescription("");
      setOpen(false);
    } catch (error) {
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
    <section
      id="store-products"
      className="grid scroll-mt-4 gap-3 rounded-xl border border-border bg-card p-4"
      aria-labelledby="store-products-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="store-products-title" className="text-lg font-semibold">
          {ru ? "Товары магазина" : "Store products"}
        </h2>
        {subjectId && (
          <button
            type="button"
            className={secondaryClass}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <PackagePlus aria-hidden="true" className="size-4" />
            {open
              ? ru
                ? "Закрыть форму"
                : "Close form"
              : ru
                ? "Добавить товар"
                : "Add product"}
          </button>
        )}
      </div>
      {created && (
        <p role="status" className="text-sm">
          {ru
            ? `«${created}» добавлен в магазин.`
            : `“${created}” was added to the store.`}
        </p>
      )}
      {subjectId && open && (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            {ru ? "Название товара" : "Product name"}
            <input
              className={fieldClass}
              required
              maxLength={180}
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            {ru ? "Тип товара" : "Product type"}
            <Select
              ui="shadcn"
              aria-label={ru ? "Тип товара" : "Product type"}
              className={fieldClass}
              value={kind}
              onValueChange={(selectedValue) =>
                setKind(selectedValue === "physical" ? "physical" : "service")
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
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            {ru ? "Краткое описание" : "Short description"}
            <input
              className={fieldClass}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            {ru ? "Цена" : "Price"}
            <input
              className={fieldClass}
              required
              inputMode="decimal"
              pattern="[0-9]+([.,][0-9]{1,8})?"
              value={amount}
              onChange={(event) => setAmount(event.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            {ru ? "Валюта" : "Currency"}
            <Select
              ui="shadcn"
              aria-label={ru ? "Валюта" : "Currency"}
              className={fieldClass}
              placeholder={ru ? "Выберите валюту" : "Choose a currency"}
              required
              value={currency ?? ""}
              onValueChange={setCurrencyId}
              options={
                options.data?.currencies.map(({ id, title }) => ({
                  value: id,
                  label: title,
                })) ?? []
              }
            />
          </label>
          {failure && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {failure}
            </p>
          )}
          <button
            type="submit"
            className={`${primaryClass} justify-self-start`}
            disabled={create.isPending || !currency}
          >
            {ru ? "Сохранить товар" : "Save product"}
          </button>
        </form>
      )}
      <EcommerceModuleStoresToProducts
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "variant", method: "eq", value: "default" },
                { column: "storeId", method: "eq", value: storeId },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          const productIds = new Set(data?.map(({ productId }) => productId));
          if (!productIds.size) {
            return (
              <p className="text-sm text-muted-foreground">
                {ru
                  ? "В магазине пока нет товаров."
                  : "There are no products in this store yet."}
              </p>
            );
          }
          return (
            <div className="grid gap-4 lg:grid-cols-2">
              {[...productIds].map((productId) => (
                <EcommerceModuleProduct
                  key={productId}
                  isServer={false}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [{ column: "id", method: "eq", value: productId }],
                      },
                    },
                  }}
                >
                  {({ data: products }) =>
                    products?.map((product) => (
                      <Subject
                        key={product.id}
                        isServer={false}
                        variant="me-ecommerce-module-product-card-default"
                        ecommerceModuleProduct={product}
                        ecommerceModuleStore={ecommerceModuleStore}
                        language={language}
                      />
                    ))
                  }
                </EcommerceModuleProduct>
              ))}
            </div>
          );
        }}
      </EcommerceModuleStoresToProducts>
    </section>
  );
}
