"use client";
import { useState, type FormEvent } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { catalogCreateOfferSchema } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentPropsExtended } from "./interface";
import { Editor } from "./Editor";
import { PaymentTiming, offerPaymentSettings } from "./PaymentTiming";

const field =
  "min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground";
const label = "grid min-w-0 gap-2 text-sm font-medium";
const button =
  "min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function Component(props: IComponentPropsExtended) {
  const context = subjectApi.ecommerceModuleCatalogContext({
    id: props.subjectId,
  });
  const create = subjectApi.ecommerceModuleOfferCreate();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [kind, setKind] = useState("physical");
  const [type, setType] = useState("one_off");
  const [productId, setProductId] = useState("");
  const [storeSelection, setStoreSelection] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const storeId =
    props.ecommerceModuleStoreId ||
    storeSelection ||
    (context.data?.stores.length === 1 ? context.data.stores[0].id : "");
  if (context.isPending) {
    return (
      <p role="status" className="p-4 text-sm text-muted-foreground">
        Loading your seller catalogue…
      </p>
    );
  }
  if (context.isError || !context.data) {
    return (
      <div role="alert" className="space-y-3 p-4 text-sm">
        <p>Could not load your seller catalogue.</p>
        <button
          type="button"
          className={button}
          onClick={() => context.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }
  if (!context.data.stores.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Create a store first. Its offers will belong to you.
      </p>
    );
  }
  if (
    props.ecommerceModuleStoreId &&
    !context.data.stores.some(
      (store) => store.id === props.ecommerceModuleStoreId,
    )
  ) {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        Only this store’s owner or an administrator can create its offers.
      </p>
    );
  }

  const token = context.data.currencies.find(
    (currency) => currency.slug?.toLowerCase() === "token",
  );
  const selectedProduct =
    mode === "new"
      ? { kind, type }
      : context.data.products.find((product) => product.id === productId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const value = (name: string) => String(values.get(name) ?? "").trim();
    const prices = context.data!.currencies.flatMap((currency) =>
      value(`price:${currency.id}`)
        ? [{ currencyId: currency.id, amount: value(`price:${currency.id}`) }]
        : [],
    );
    if (
      value("paymentTiming") === "work-formula" &&
      (!token ||
        !prices.some(
          (price) =>
            price.currencyId === token.id && /^0(?:\.0+)?$/.test(price.amount),
        ))
    ) {
      setError(
        props.language === "ru"
          ? "Укажите цену оформления 0 Token."
          : "Set the checkout price to 0 Token.",
      );
      return;
    }
    const packages =
      value("length_cm") ||
      value("width_cm") ||
      value("height_cm") ||
      value("weight_kg")
        ? [
            {
              count: Number(value("box_count") || "1"),
              length_cm: value("length_cm") || undefined,
              width_cm: value("width_cm") || undefined,
              height_cm: value("height_cm") || undefined,
              weight_kg: value("weight_kg") || undefined,
            },
          ]
        : undefined;
    const parsed = catalogCreateOfferSchema.safeParse({
      storeId,
      productId: mode === "existing" ? value("productId") : undefined,
      product:
        mode === "new"
          ? {
              title: { en: value("title") },
              kind: value("kind"),
              type: value("type"),
              singleUnitPerOrder: values.has("singleUnitPerOrder"),
              formula: value("formula"),
              formulaVersion: "1",
            }
          : undefined,
      prices,
      stockQuantity: unlimited ? null : value("stock"),
      configurationKey: value("configurationKey"),
      settings: {
        packages,
        ...offerPaymentSettings(value("paymentTiming") || "in-cart", token?.id),
      },
    });
    setMessage("");
    setError("");
    if (!parsed.success) {
      setError(
        "Check the store, product, at least one currency price, whole stock quantity and package values.",
      );
      return;
    }
    try {
      const result = await create.mutateAsync({
        id: props.subjectId,
        data: parsed.data,
      });
      setMessage(
        `Offer created. SKU: ${result.offer.sku}. ${mode === "new" ? "You own the new product and this offer." : "The shared product keeps its current owner."}`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not create the offer. Your draft is preserved.",
      );
    }
  }

  return (
    <section
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      className="space-y-5 rounded-2xl border border-border bg-card p-5 text-card-foreground"
    >
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">Create a sellable product</h2>
        <p className="text-sm text-muted-foreground">
          Create a product and its first store offer together, or add your offer
          to an existing product.
        </p>
      </header>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={create.isPending} className="space-y-5">
          <label className={label}>
            Store
            <select
              className={field}
              value={storeId}
              required
              disabled={
                Boolean(props.ecommerceModuleStoreId) ||
                context.data.stores.length === 1
              }
              onChange={(event) => setStoreSelection(event.target.value)}
            >
              <option value="">Choose a writable store</option>
              {context.data.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.title?.en || store.adminTitle || store.slug}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Product
            <select
              className={field}
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as "new" | "existing")
              }
            >
              <option value="new">Create a new product</option>
              <option value="existing">Use an existing product</option>
            </select>
          </label>
          {mode === "existing" ? (
            <label className={label}>
              Shared product
              <select
                className={field}
                name="productId"
                required
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="">Choose a product</option>
                {context.data.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title?.en || product.adminTitle || product.slug}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-muted-foreground">
                Its description and formula remain with its owner. You control
                your prices, stock and services.
              </span>
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>
                Product title
                <input name="title" className={field} required />
              </label>
              <label className={label}>
                Kind
                <input
                  name="kind"
                  className={field}
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  placeholder="physical, digital, service, tax, commission…"
                  required
                />
              </label>
              <label className={label}>
                Billing period
                <select
                  name="type"
                  className={field}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="one_off">One-off</option>
                  <option value="subscription">Subscription</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
                <input name="singleUnitPerOrder" type="checkbox" />
                Limit to one unit per order
              </label>
              <label className={`${label} sm:col-span-2`}>
                Product formula
                <input
                  name="formula"
                  className={`${field} font-mono`}
                  defaultValue="unit_price * quantity"
                  required
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Version 1. Unit price comes from this offer; quantity comes
                  from the order.
                </span>
              </label>
            </div>
          )}
          {selectedProduct?.kind === "service" &&
            selectedProduct.type === "one_off" && (
              <PaymentTiming
                key={mode === "new" ? "new" : productId}
                language={props.language}
                currencyId={token?.id}
              />
            )}
          <label className={label}>
            Configuration key
            <input
              name="configurationKey"
              className={field}
              placeholder="For example, oak-two-doors"
            />
            <span className="text-xs font-normal text-muted-foreground">
              Use the same key for identical configurations at different stores.
            </span>
          </label>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-semibold">Unit prices</legend>
            {context.data.currencies.map((currency) => (
              <label key={currency.id} className={label}>
                {currency.title || currency.slug}
                <input
                  name={`price:${currency.id}`}
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave blank to omit this currency"
                />
              </label>
            ))}
          </fieldset>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(event) => setUnlimited(event.target.checked)}
            />
            No stock limit
          </label>
          {!unlimited && (
            <label className={label}>
              Warehouse stock
              <input
                name="stock"
                className={field}
                required
                inputMode="numeric"
                pattern="(0|[1-9][0-9]*)"
                defaultValue="0"
              />
              <span className="text-xs font-normal text-muted-foreground">
                Zero means sold out. Stock is shared across orders, addresses
                and currencies.
              </span>
            </label>
          )}
          <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <legend className="mb-3 font-semibold">
              Packaging per unit · optional
            </legend>
            {[
              { name: "box_count", title: "Box count" },
              { name: "length_cm", title: "Length · cm" },
              { name: "width_cm", title: "Width · cm" },
              { name: "height_cm", title: "Height · cm" },
              { name: "weight_kg", title: "Gross weight · kg" },
            ].map((input) => (
              <label key={input.name} className={label}>
                {input.title}
                <input
                  name={input.name}
                  className={field}
                  type="number"
                  min="0.01"
                  step={input.name === "box_count" ? "1" : "0.01"}
                />
              </label>
            ))}
          </fieldset>
          <button className={button} type="submit">
            {create.isPending
              ? "Creating…"
              : mode === "new"
                ? "Create product and offer"
                : "Create offer"}
          </button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <Editor
        key={storeId}
        language={props.language}
        subjectId={props.subjectId}
        storeId={storeId}
        context={context.data}
        onRefresh={context.refetch}
      />
    </section>
  );
}
