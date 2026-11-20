"use client";
import { memo, useCallback, useState, type FormEvent } from "react";
import { createId } from "@paralleldrive/cuid2";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { catalogCreateOfferSchema } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IModel as ILink } from "@sps/ecommerce/relations/offers-to-offers/sdk/model";
import type { IBoxDraft, IEditorProps } from "./interface";
import { PaymentTiming } from "./PaymentTiming";

const field =
  "min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground";
const label = "grid min-w-0 gap-2 text-sm font-medium";
const button =
  "min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

export function Editor(props: IEditorProps) {
  const [selectedId, setSelectedId] = useState("");
  const offers = props.context.offers.filter(
    (offer) => offer.storeId === props.storeId,
  );
  const offer = offers.find((offer) => offer.id === selectedId) ?? offers[0];
  if (!props.storeId || !offer) {
    return (
      <p className="text-sm text-muted-foreground">
        Choose a store with an existing offer to edit its catalogue.
      </p>
    );
  }
  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer font-semibold">
        Edit existing offers, rates and services
      </summary>
      <div className="mt-4 space-y-5">
        <label className={label}>
          Your offer
          <select
            className={field}
            value={offer.id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {offers.map((item) => (
              <option key={item.id} value={item.id}>
                {props.context.products.find(
                  (product) => product.id === item.productId,
                )?.title?.en || item.productId}{" "}
                · {item.sku}
              </option>
            ))}
          </select>
        </label>
        <OfferEditor key={offer.id} {...props} offer={offer} />
      </div>
    </details>
  );
}

function OfferEditor(props: IEditorProps & { offer: IOffer }) {
  const { offer, context } = props;
  const updateOffer = subjectApi.ecommerceModuleCatalogMutation();
  const updateProduct = subjectApi.ecommerceModuleCatalogMutation();
  const setAttribute = subjectApi.ecommerceModuleCatalogAttributeSet();
  const deleteAttribute = subjectApi.ecommerceModuleCatalogMutation();
  const createLink = subjectApi.ecommerceModuleCatalogMutation();
  const deleteLink = subjectApi.ecommerceModuleCatalogMutation();
  const attrs = context.attributes.filter(
    (attribute) =>
      attribute.owner.type === "offer" && attribute.owner.id === offer.id,
  );
  const stock = attrs.find((attribute) => attribute.key === "stock_quantity");
  const [unlimited, setUnlimited] = useState(!stock);
  const [afterAcceptance, setAfterAcceptance] = useState(
    Boolean(offer.settings.requiresResultAcceptance),
  );
  const [standalone, setStandalone] = useState(
    Boolean(offer.settings.standalone),
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [productFeedback, setProductFeedback] = useState("");
  const [productError, setProductError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const ownsProduct = context.ownedProductIds.includes(offer.productId);
  const [linkRole, setLinkRole] = useState(
    ownsProduct ? "delivery" : "fulfilled-by",
  );
  const product = context.products.find(
    (product) => product.id === offer.productId,
  );
  const serviceProduct = product?.kind === "service";
  const commissionedService = serviceProduct && product.type === "one_off";
  const targets = context.offers.filter(
    (target) =>
      target.id !== offer.id &&
      (linkRole === "fulfilled-by"
        ? target.variant === "provider" && target.productId === offer.productId
        : target.variant === "default" &&
          context.products.some(
            (product) =>
              product.id === target.productId && product.kind === "service",
          )),
  );
  const [boxes, setBoxes] = useState<IBoxDraft[]>(() =>
    (offer.settings.packages ?? []).map((box) => ({
      id: createId(),
      count: String(box.count),
      length_cm: box.length_cm ?? "",
      width_cm: box.width_cm ?? "",
      height_cm: box.height_cm ?? "",
      weight_kg: box.weight_kg ?? "",
    })),
  );
  const busy =
    updateOffer.isPending ||
    setAttribute.isPending ||
    deleteAttribute.isPending;
  const onBoxChange = useCallback(
    (id: string, name: keyof Omit<IBoxDraft, "id">, value: string) =>
      setBoxes((current) =>
        current.map((box) => (box.id === id ? { ...box, [name]: value } : box)),
      ),
    [],
  );
  const onBoxRemove = useCallback(
    (id: string) =>
      setBoxes((current) => current.filter((box) => box.id !== id)),
    [],
  );
  const onLinkRemove = useCallback(
    async (id: string) => {
      setRemovingId(id);
      setError("");
      try {
        await deleteLink.mutateAsync({
          id: props.subjectId,
          data: { entity: "offers-to-offers", method: "DELETE", recordId: id },
        });
        await props.onRefresh();
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not remove the service link.",
        );
      } finally {
        setRemovingId(null);
      }
    },
    [deleteLink.mutateAsync, props.subjectId, props.onRefresh],
  );

  async function archive() {
    setError("");
    setFeedback("");
    try {
      await updateOffer.mutateAsync({
        id: props.subjectId,
        data: {
          entity: "stores-to-products",
          method: "PATCH",
          recordId: offer.id,
          data: { variant: "hidden" },
        },
      });
      await props.onRefresh();
      setFeedback(
        "New sales stopped. Existing reservations, invoices and purchase history are preserved.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not stop new sales.",
      );
    }
  }

  async function saveProductQuantityLimit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setProductError("");
    setProductFeedback("");
    try {
      await updateProduct.mutateAsync({
        id: props.subjectId,
        data: {
          entity: "products",
          method: "PATCH",
          recordId: offer.productId,
          data: { singleUnitPerOrder: values.has("singleUnitPerOrder") },
        },
      });
      await props.onRefresh();
      setProductFeedback("Product quantity limit saved.");
    } catch (failure) {
      setProductError(
        failure instanceof Error
          ? failure.message
          : "Could not save the product quantity limit.",
      );
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const text = (name: string) => String(values.get(name) ?? "").trim();
    setError("");
    setFeedback("");
    try {
      const settings = catalogCreateOfferSchema.shape.settings.parse({
        ...offer.settings,
        ...(commissionedService && {
          requiresResultAcceptance:
            text("paymentTiming") === "after-acceptance",
        }),
        standalone:
          values.has("standalone") ||
          (commissionedService && text("paymentTiming") === "after-acceptance"),
        receiptMethod: text("receiptMethod"),
        regionIds: text("regions")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        quoteMinutes: Number(text("quoteMinutes")),
        origin:
          text("latitude") && text("longitude")
            ? {
                latitude: Number(text("latitude")),
                longitude: Number(text("longitude")),
              }
            : undefined,
        packages: boxes.map(({ id: _id, count, ...box }) => ({
          ...Object.fromEntries(
            Object.entries(box).filter(([, value]) => value),
          ),
          count: Number(count),
        })),
      });
      if (!unlimited && !/^(0|[1-9]\d*)$/.test(text("stock"))) {
        throw new Error("Stock must be a whole number of zero or more.");
      }
      await updateOffer.mutateAsync({
        id: props.subjectId,
        data: {
          entity: "stores-to-products",
          method: "PATCH",
          recordId: offer.id,
          data: {
            configurationKey: text("configurationKey"),
            variant: text("offerVariant"),
            settings,
          },
        },
      });
      for (const currency of context.currencies) {
        const amount = text(`price:${currency.id}`);
        const previous = attrs.find(
          (attribute) =>
            attribute.type === "price" && attribute.currencyId === currency.id,
        );
        if (amount) {
          await setAttribute.mutateAsync({
            id: props.subjectId,
            data: {
              owner: { type: "offer", id: offer.id },
              key: "price",
              type: "price",
              field: "number",
              number: amount,
              currencyId: currency.id,
            },
          });
        } else if (previous) {
          await deleteAttribute.mutateAsync({
            id: props.subjectId,
            data: {
              entity: "attributes",
              method: "DELETE",
              recordId: previous.id,
            },
          });
        }
      }
      if (unlimited && stock) {
        await deleteAttribute.mutateAsync({
          id: props.subjectId,
          data: { entity: "attributes", method: "DELETE", recordId: stock.id },
        });
      } else if (!unlimited) {
        await setAttribute.mutateAsync({
          id: props.subjectId,
          data: {
            owner: { type: "offer", id: offer.id },
            key: "stock_quantity",
            field: "number",
            number: text("stock"),
          },
        });
      }
      await props.onRefresh();
      setFeedback("Offer settings, prices and stock saved.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save all changes. Refresh to check the stored values.",
      );
    }
  }

  async function link(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    try {
      await createLink.mutateAsync({
        id: props.subjectId,
        data: {
          entity: "offers-to-offers",
          method: "POST",
          data: {
            sourceOfferId: offer.id,
            targetOfferId: String(values.get("target")),
            variant: String(values.get("role")),
            recurrence: String(values.get("recurrence")) as "first" | "each",
          },
        },
      });
      await props.onRefresh();
      setFeedback("Service link saved.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save the service link.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {ownsProduct && product && (
        <form onSubmit={saveProductQuantityLimit} className="space-y-2">
          <fieldset disabled={updateProduct.isPending} className="space-y-2">
            <legend className="font-semibold">Product quantity limit</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                key={String(product.singleUnitPerOrder)}
                name="singleUnitPerOrder"
                type="checkbox"
                defaultChecked={product.singleUnitPerOrder}
              />
              Limit to one unit per order
            </label>
            <p className="text-xs text-muted-foreground">
              This setting applies to every store that offers this product.
            </p>
            <button type="submit" className={button}>
              Save product quantity limit
            </button>
          </fieldset>
          {productFeedback && <p role="status">{productFeedback}</p>}
          {productError && <p role="alert">{productError}</p>}
        </form>
      )}
      <form onSubmit={save} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <p className="break-all text-xs text-muted-foreground">
            SKU {offer.sku}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Configuration key
              <input
                name="configurationKey"
                className={field}
                defaultValue={offer.configurationKey}
              />
            </label>
            <label className={label}>
              Offer role
              <select
                key={offer.variant}
                name="offerVariant"
                className={field}
                defaultValue={offer.variant}
              >
                <option value="default">Retail</option>
                <option value="provider">Provider</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
          </div>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-semibold">
              Unit prices · blank removes a price
            </legend>
            {context.currencies.map((currency) => (
              <label key={currency.id} className={label}>
                {currency.title}
                <input
                  name={`price:${currency.id}`}
                  className={field}
                  type="number"
                  min="0"
                  step={String(10 ** -(currency.minorUnitDigits ?? 2))}
                  defaultValue={
                    attrs.find(
                      (attribute) =>
                        attribute.type === "price" &&
                        attribute.currencyId === currency.id,
                    )?.number ?? ""
                  }
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
            Unlimited stock
          </label>
          {!unlimited && (
            <label className={label}>
              Warehouse stock
              <input
                name="stock"
                className={field}
                inputMode="numeric"
                pattern="(0|[1-9][0-9]*)"
                required
                defaultValue={stock?.number ?? "0"}
              />
              <span className="text-xs font-normal text-muted-foreground">
                Zero means sold out. Active reservations prevent lowering or
                removing their stock limit.
              </span>
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Receipt method
              <select
                name="receiptMethod"
                className={field}
                defaultValue={offer.settings.receiptMethod ?? "shipping"}
              >
                <option value="shipping">Delivery</option>
                <option value="pickup">Pickup</option>
                <option value="electronic">Electronic</option>
              </select>
            </label>
            <label className={label}>
              Quote lifetime · minutes
              <input
                name="quoteMinutes"
                className={field}
                type="number"
                min="1"
                max="1440"
                defaultValue={offer.settings.quoteMinutes ?? 15}
                required
              />
            </label>
            <label className={label}>
              Delivery region IDs · comma separated
              <input
                name="regions"
                className={field}
                defaultValue={offer.settings.regionIds?.join(", ")}
              />
            </label>
            <label className={label}>
              Origin latitude
              <input
                name="latitude"
                className={field}
                type="number"
                min="-90"
                max="90"
                step="any"
                defaultValue={offer.settings.origin?.latitude}
              />
            </label>
            <label className={label}>
              Origin longitude
              <input
                name="longitude"
                className={field}
                type="number"
                min="-180"
                max="180"
                step="any"
                defaultValue={offer.settings.origin?.longitude}
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              name="standalone"
              type="checkbox"
              checked={standalone || (commissionedService && afterAcceptance)}
              disabled={commissionedService && afterAcceptance}
              onChange={(event) => setStandalone(event.target.checked)}
            />
            Allow this service to be sold separately
          </label>
          {commissionedService && (
            <PaymentTiming
              afterAcceptance={offer.settings.requiresResultAcceptance}
              onChange={setAfterAcceptance}
            />
          )}
          <fieldset className="space-y-3">
            <legend className="mb-3 font-semibold">
              External packaging per product unit
            </legend>
            {boxes.map((box) => (
              <BoxRow
                key={box.id}
                box={box}
                onChange={onBoxChange}
                onRemove={onBoxRemove}
              />
            ))}
            <button
              type="button"
              className={button}
              onClick={() =>
                setBoxes((current) => [
                  ...current,
                  {
                    id: createId(),
                    count: "1",
                    length_cm: "",
                    width_cm: "",
                    height_cm: "",
                    weight_kg: "",
                  },
                ])
              }
            >
              Add box type
            </button>
          </fieldset>
          <button className={button} type="submit">
            {busy ? "Saving…" : "Save offer settings, prices and stock"}
          </button>
          <button
            className={button}
            type="button"
            disabled={busy || offer.variant === "hidden"}
            onClick={archive}
          >
            {offer.variant === "hidden"
              ? "Archived · unavailable for new sales"
              : "Stop new sales"}
          </button>
        </fieldset>
      </form>
      <ScopedAttributeForm {...props} />
      <section className="space-y-3">
        <h3 className="font-semibold">Delivery, add-ons and fulfilment</h3>
        <ul className="space-y-2">
          {context.links
            .filter(
              (link) =>
                link.sourceOfferId === offer.id ||
                (link.variant !== "fulfilled-by" &&
                  link.sourceProductId === offer.productId),
            )
            .map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                target={
                  context.offers.find(
                    (target) => target.id === link.targetOfferId,
                  )?.sku ?? link.targetOfferId
                }
                removing={removingId === link.id}
                onRemove={
                  link.variant === "fulfilled-by" || ownsProduct
                    ? onLinkRemove
                    : undefined
                }
              />
            ))}
        </ul>
        {offer.variant === "default" && (ownsProduct || serviceProduct) && (
          <form onSubmit={link} className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Association
              <select
                name="role"
                className={field}
                value={linkRole}
                onChange={(event) => setLinkRole(event.target.value)}
              >
                {ownsProduct && <option value="delivery">Delivery</option>}
                {ownsProduct && <option value="add-on">Add-on</option>}
                <option value="fulfilled-by" disabled={!serviceProduct}>
                  Fulfilled by provider
                </option>
              </select>
            </label>
            <label className={label}>
              Target offer
              <select key={linkRole} name="target" className={field} required>
                <option value="">Choose a service or provider offer</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {context.products.find(
                      (product) => product.id === target.productId,
                    )?.title?.en || target.productId}{" "}
                    · {target.sku} · {target.variant}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Recurrence
              <select name="recurrence" className={field}>
                <option value="first">First delivery only</option>
                <option value="each">Every delivery</option>
              </select>
            </label>
            <button
              className={button}
              type="submit"
              disabled={createLink.isPending}
            >
              {createLink.isPending ? "Saving…" : "Add service link"}
            </button>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Delivery methods and add-ons apply to this product in every store.
              Choose the service offer from the contractor who supplies it.
            </p>
          </form>
        )}
      </section>
      {feedback && (
        <p role="status" className="text-sm text-muted-foreground">
          {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const BoxRow = memo(function BoxRow({
  box,
  onChange,
  onRemove,
}: {
  box: IBoxDraft;
  onChange: (
    id: string,
    name: keyof Omit<IBoxDraft, "id">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3 sm:grid-cols-5">
      {(
        [
          { name: "count", title: "Box count" },
          { name: "length_cm", title: "Length · cm" },
          { name: "width_cm", title: "Width · cm" },
          { name: "height_cm", title: "Height · cm" },
          { name: "weight_kg", title: "Gross weight · kg" },
        ] as const
      ).map((input) => (
        <label key={input.name} className={label}>
          {input.title}
          <input
            className={field}
            type="number"
            min={input.name === "count" ? "1" : "0.01"}
            step={input.name === "count" ? "1" : "any"}
            required={input.name === "count"}
            value={box[input.name]}
            onChange={(event) =>
              onChange(box.id, input.name, event.target.value)
            }
          />
        </label>
      ))}
      <button
        type="button"
        className={`${button} col-span-2 sm:col-span-5`}
        onClick={() => onRemove(box.id)}
      >
        Remove box type
      </button>
    </div>
  );
});

const LinkRow = memo(function LinkRow({
  link,
  target,
  removing,
  onRemove,
}: {
  link: ILink;
  target: string;
  removing: boolean;
  onRemove?: (id: string) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
      <span className="break-all">
        {link.variant} · {target} · {link.recurrence}
      </span>
      {onRemove && (
        <button
          className={button}
          type="button"
          disabled={removing}
          onClick={() => onRemove(link.id)}
        >
          {removing ? "Removing…" : "Remove link"}
        </button>
      )}
    </li>
  );
});

function ScopedAttributeForm(props: IEditorProps & { offer: IOffer }) {
  const mutation = subjectApi.ecommerceModuleCatalogAttributeSet();
  const [scope, setScope] = useState<"store" | "product">("store");
  const [key, setKey] = useState("dispatch_fee");
  const [feedback, setFeedback] = useState("");
  const ownsProduct = props.context.ownedProductIds.includes(
    props.offer.productId,
  );
  const ownerId = scope === "store" ? props.storeId : props.offer.productId;
  const attributes = props.context.attributes.filter(
    (attribute) =>
      attribute.owner.type === scope &&
      attribute.owner.id === ownerId &&
      (scope === "product" || attribute.field === "number"),
  );
  const current = attributes.find((attribute) => attribute.key === key);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setFeedback("");
    try {
      const value = String(values.get("value") ?? "");
      await mutation.mutateAsync({
        id: props.subjectId,
        data: {
          owner: { type: scope, id: ownerId },
          key,
          field: scope === "product" ? "string" : "number",
          string: scope === "product" ? value : undefined,
          number: scope === "store" ? value : undefined,
          currencyId:
            scope === "store" && values.get("currency")
              ? String(values.get("currency"))
              : undefined,
        },
      });
      await props.onRefresh();
      setFeedback("Catalogue attribute saved.");
    } catch (failure) {
      setFeedback(
        failure instanceof Error
          ? failure.message
          : "Could not save this catalogue attribute.",
      );
    }
  }
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Store rates and shared Product formula</h3>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Owner
          <select
            className={field}
            value={scope}
            onChange={(event) => {
              const next = event.target.value as "store" | "product";
              setScope(next);
              setKey(next === "product" ? "price_formula" : "dispatch_fee");
            }}
          >
            <option value="store">This store’s rates</option>
            <option value="product" disabled={!ownsProduct}>
              Shared Product · owner only
            </option>
          </select>
        </label>
        <label className={label}>
          Attribute key
          {scope === "product" ? (
            <select
              className={field}
              value={key}
              onChange={(event) => setKey(event.target.value)}
            >
              <option value="price_formula">Price formula</option>
              <option value="formula_version">Formula version</option>
            </select>
          ) : (
            <input
              className={field}
              required
              pattern="[a-z][a-z0-9_-]*"
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
          )}
        </label>
        <label className={label}>
          Value
          <input
            key={`${scope}-${key}`}
            name="value"
            className={field}
            required
            defaultValue={
              scope === "product" ? current?.text : (current?.number ?? "")
            }
          />
        </label>
        {scope === "store" && (
          <label className={label}>
            Currency
            <select
              name="currency"
              className={field}
              required={!key.endsWith("_percent")}
              defaultValue={current?.currencyId ?? ""}
            >
              <option value="">No currency · percentage</option>
              {props.context.currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className={button} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save rate or formula"}
        </button>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Examples: dispatch_fee, rate_per_km, assembly_rate. Percentage keys
          end in _percent and have no currency. Product formulas remain with
          their owner.
        </p>
      </form>
      <dl className="space-y-1 text-xs text-muted-foreground">
        {attributes.map((attribute) => (
          <div
            key={`${attribute.id}-${attribute.key}`}
            className="flex flex-wrap justify-between gap-2"
          >
            <dt>{attribute.key}</dt>
            <dd className="break-all">
              {attribute.number ?? attribute.text}{" "}
              {
                props.context.currencies.find(
                  (currency) => currency.id === attribute.currencyId,
                )?.title
              }
            </dd>
          </div>
        ))}
      </dl>
      {feedback && (
        <p role="status" className="text-sm text-muted-foreground">
          {feedback}
        </p>
      )}
    </section>
  );
}
