"use client";

import { useId, useState, type FormEvent } from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";
import type {
  IComponentProps,
  IOfferProduct,
  IStoreOfferDraft,
} from "./interface";

const field =
  "min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground";
const label = "grid min-w-0 gap-2 text-sm font-medium";

export function Component({
  stores = [],
  products = [],
  draft: initialDraft,
  actorRole = "owner",
  onSave,
}: IComponentProps) {
  const id = useId();
  const firstStore =
    stores.find((store) => store.canEdit || actorRole === "admin") ?? stores[0];
  const firstProduct = products[0];
  const [draft, setDraft] = useState<IStoreOfferDraft>(
    () =>
      initialDraft ?? {
        storeId: firstStore?.id ?? "",
        productId: firstProduct?.id ?? "",
        productMode: "existing",
        title: firstProduct?.title ?? "",
        kind: firstProduct?.kind ?? "physical",
        type: firstProduct?.type ?? "one_off",
        formula: firstProduct?.formula ?? "unit_price * quantity",
        formulaVersion: firstProduct?.formulaVersion ?? "1",
        sku: "",
        rubPrice: "",
        usdPrice: "",
        stockQuantity: null,
        dispatchFee: "400",
        ratePerKm: "25",
        assemblyRate: "2000",
        packages: [],
      },
  );
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const store = stores.find((item) => item.id === draft.storeId);
  const product = products.find((item) => item.id === draft.productId);
  const canEditOffer =
    actorRole === "admin" || (actorRole === "owner" && store?.canEdit === true);
  const canEditProduct =
    canEditOffer &&
    (actorRole === "admin" ||
      draft.productMode === "new" ||
      product?.canEdit === true);
  const validStock =
    draft.stockQuantity === null ||
    (/^\d+$/.test(draft.stockQuantity) &&
      Number.isSafeInteger(Number(draft.stockQuantity)));
  const deliveryPreview =
    draft.dispatchFee.trim() &&
    draft.ratePerKm.trim() &&
    Number.isFinite(Number(draft.dispatchFee)) &&
    Number.isFinite(Number(draft.ratePerKm))
      ? Number(draft.dispatchFee) + Number(draft.ratePerKm) * 24
      : null;

  function update(values: Partial<IStoreOfferDraft>) {
    setDraft((current) => ({ ...current, ...values }));
    setStatus("");
  }

  function chooseProduct(selected: IOfferProduct) {
    update({
      productId: selected.id,
      title: selected.title,
      kind: selected.kind,
      type: selected.type,
      formula: selected.formula,
      formulaVersion: selected.formulaVersion,
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEditOffer || !validStock || pending) return;
    setPending(true);
    setStatus("");
    try {
      await onSave?.(draft);
      setStatus(
        draft.productMode === "new"
          ? "Product and offer created in this preview. You own both records."
          : "Offer saved in this preview. The shared product keeps its current owner.",
      );
    } catch {
      setStatus(
        "Could not save the offer. Your draft is preserved; try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      data-ds-block="ecommerce.store.offer-editor"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="store"
      data-variant="offer-editor"
      className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8"
    >
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Store · seller catalogue
        </p>
        <h2 className="text-2xl font-semibold">
          {draft.id ? "Edit offer" : "Create an offer"}
        </h2>
        <p className="text-sm text-muted-foreground">
          A product has one shared description. Each store sets its own prices,
          stock and service rates.
        </p>
      </header>
      <form onSubmit={save} className="mt-6 space-y-6">
        <label className={label}>
          Store
          <select
            className={field}
            value={draft.storeId}
            disabled={
              pending ||
              stores.filter((item) => item.canEdit || actorRole === "admin")
                .length <= 1
            }
            onChange={(event) => update({ storeId: event.target.value })}
          >
            {stores.map((item) => (
              <option
                key={item.id}
                value={item.id}
                disabled={!item.canEdit && actorRole !== "admin"}
              >
                {item.title}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-muted-foreground">
            {actorRole === "admin"
              ? "Administrator: all stores and products are editable."
              : canEditOffer
                ? "You own this store and its offers."
                : "Only this store’s owner or an administrator can save changes."}
          </span>
        </label>
        <fieldset
          disabled={!canEditOffer || pending}
          className="space-y-5 disabled:opacity-70"
        >
          <legend className="mb-3 text-base font-semibold">Product</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(["existing", "new"] as const).map((mode) => (
              <label key={mode} className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name={`${id}-mode`}
                  value={mode}
                  checked={draft.productMode === mode}
                  onChange={() =>
                    update(
                      mode === "new"
                        ? {
                            productMode: mode,
                            productId: "",
                            title: "",
                            kind: "physical",
                            type: "one_off",
                            formula: "unit_price * quantity",
                            formulaVersion: "1",
                          }
                        : {
                            productMode: mode,
                            productId: firstProduct?.id ?? "",
                            title: firstProduct?.title ?? "",
                            kind: firstProduct?.kind ?? "physical",
                            type: firstProduct?.type ?? "one_off",
                            formula: firstProduct?.formula ?? "",
                            formulaVersion: firstProduct?.formulaVersion ?? "1",
                          },
                    )
                  }
                />
                {mode === "existing"
                  ? "Use an existing product"
                  : "Create a new product"}
              </label>
            ))}
          </div>
          {draft.productMode === "existing" && (
            <label className={label}>
              Shared product
              <select
                className={field}
                value={draft.productId}
                required
                onChange={(event) => {
                  const selected = products.find(
                    (item) => item.id === event.target.value,
                  );
                  if (selected) chooseProduct(selected);
                }}
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            {canEditProduct
              ? "You can edit the product’s shared description and formula."
              : "This product belongs to another seller. You can sell it and edit your offer; its description and formula stay with the product owner."}
          </p>
          <fieldset
            disabled={!canEditProduct}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className={`${label} sm:col-span-2`}>
              Product title
              <input
                className={field}
                required
                value={draft.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            <label className={label}>
              Product kind
              <select
                className={field}
                value={draft.kind}
                onChange={(event) =>
                  update({ kind: event.target.value as IOfferProduct["kind"] })
                }
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </label>
            <label className={label}>
              Billing period
              <select
                className={field}
                value={draft.type}
                onChange={(event) =>
                  update({ type: event.target.value as IOfferProduct["type"] })
                }
              >
                <option value="one_off">One-off</option>
                <option value="subscription">Subscription</option>
              </select>
            </label>
            <label className={label}>
              Formula version
              <input
                className={field}
                required
                value={draft.formulaVersion}
                onChange={(event) =>
                  update({ formulaVersion: event.target.value })
                }
              />
            </label>
            <label className={label}>
              Product formula
              <input
                className={`${field} font-mono`}
                required
                value={draft.formula}
                onChange={(event) => update({ formula: event.target.value })}
              />
            </label>
          </fieldset>
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold">Your offer</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {draft.sku
                ? `SKU ${draft.sku}`
                : "A unique SKU is assigned when the offer is created."}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Unit price · RUB
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.rubPrice}
                  onChange={(event) => update({ rubPrice: event.target.value })}
                />
              </label>
              <label className={label}>
                Unit price · USD · optional
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.usdPrice}
                  onChange={(event) => update({ usdPrice: event.target.value })}
                />
              </label>
            </div>
            <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.stockQuantity === null}
                onChange={(event) =>
                  update({ stockQuantity: event.target.checked ? null : "0" })
                }
              />
              No stock limit
            </label>
            {draft.stockQuantity !== null && (
              <label className={label}>
                Warehouse stock
                <input
                  className={field}
                  inputMode="numeric"
                  required
                  aria-invalid={!validStock}
                  aria-describedby={`${id}-stock-help`}
                  value={draft.stockQuantity}
                  onChange={(event) =>
                    update({ stockQuantity: event.target.value })
                  }
                />
                <span
                  id={`${id}-stock-help`}
                  className={`text-xs font-normal ${validStock ? "text-muted-foreground" : "text-destructive"}`}
                >
                  {!validStock
                    ? "Enter a whole number of zero or more. This offer cannot be published with invalid stock."
                    : draft.stockQuantity === "0"
                      ? "Zero stock: buyers see this offer as sold out."
                      : "Stock is shared by every order for this offer, across addresses and currencies. Open carts do not reserve it."}
                </span>
              </label>
            )}
          </div>
          <fieldset className="space-y-3 border-t border-border pt-5">
            <legend className="pt-5 font-semibold">
              Store service rates · RUB
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={label}>
                Dispatch fee
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.dispatchFee}
                  onChange={(event) =>
                    update({ dispatchFee: event.target.value })
                  }
                />
                <code className="text-xs font-normal text-muted-foreground">
                  dispatch_fee
                </code>
              </label>
              <label className={label}>
                Rate per kilometre
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.ratePerKm}
                  onChange={(event) =>
                    update({ ratePerKm: event.target.value })
                  }
                />
                <code className="text-xs font-normal text-muted-foreground">
                  rate_per_km
                </code>
              </label>
              <label className={label}>
                Assembly per unit
                <input
                  className={field}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.assemblyRate}
                  onChange={(event) =>
                    update({ assemblyRate: event.target.value })
                  }
                />
                <code className="text-xs font-normal text-muted-foreground">
                  assembly_rate
                </code>
              </label>
            </div>
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Delivery example:{" "}
              <code className="break-words">
                dispatch_fee + rate_per_km * distance_km
              </code>
              . At 24 km:{" "}
              {deliveryPreview == null
                ? "enter both rates to calculate"
                : `${deliveryPreview.toLocaleString("en-US")} ₽`}
              . The service product owns this formula; the selected store
              supplies its named rates.
            </p>
          </fieldset>
          {draft.kind === "physical" && (
            <fieldset className="space-y-4 border-t border-border pt-5">
              <legend className="pt-5 font-semibold">
                Packaging per product unit
              </legend>
              <p className="text-xs text-muted-foreground">
                Use external box dimensions in centimetres and gross weight in
                kilograms. Assembled dimensions belong to the product card.
              </p>
              {draft.packages.map((box) => (
                <div
                  key={box.id}
                  className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 sm:grid-cols-5"
                >
                  {(
                    [
                      { key: "count", title: "Box count" },
                      { key: "lengthCm", title: "Length · cm" },
                      { key: "widthCm", title: "Width · cm" },
                      { key: "heightCm", title: "Height · cm" },
                      { key: "weightKg", title: "Weight · kg" },
                    ] as const
                  ).map((input) => (
                    <label key={input.key} className={label}>
                      {input.title}
                      <input
                        className={field}
                        type="number"
                        min={input.key === "count" ? "1" : "0.01"}
                        step={input.key === "count" ? "1" : "0.01"}
                        required
                        value={box[input.key]}
                        onChange={(event) =>
                          update({
                            packages: draft.packages.map((current) =>
                              current.id === box.id
                                ? {
                                    ...current,
                                    [input.key]: event.target.value,
                                  }
                                : current,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              ))}
              <WebsiteBuilderModuleButton
                variant="control"
                appearance="secondary"
                type="button"
                onClick={() =>
                  update({
                    packages: [
                      ...draft.packages,
                      {
                        id: `${id}-box-${draft.packages.length + 1}`,
                        count: "1",
                        lengthCm: "",
                        widthCm: "",
                        heightCm: "",
                        weightKg: "",
                      },
                    ],
                  })
                }
              >
                Add a box type
              </WebsiteBuilderModuleButton>
            </fieldset>
          )}
        </fieldset>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p role="status" className="max-w-xl text-sm text-muted-foreground">
            {status || "Local preview. Saving changes only this example."}
          </p>
          <WebsiteBuilderModuleButton
            variant="control"
            appearance="primary"
            type="submit"
            disabled={!canEditOffer || !validStock || pending}
          >
            {pending
              ? "Saving…"
              : draft.id
                ? "Save offer"
                : draft.productMode === "new"
                  ? "Create product and offer"
                  : "Create offer"}
          </WebsiteBuilderModuleButton>
        </footer>
      </form>
    </section>
  );
}
