import type {
  IStoreProductOffer,
  IStoreProductRelations,
  IStoreProductUpdate,
} from "@sps/rbac/models/subject/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { settingsFormStyles, Button, Input } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { memo, useId, useState, type FormEvent } from "react";
import { localizedText } from "../../view-model";
import { DirectoryPicker } from "../../directories/DirectoryPicker";

type TAttribute = IStoreProductRelations["attributes"][number];
type TAction = NonNullable<IStoreProductUpdate["relation"]>;
type TValue = string | Record<string, string | undefined>;

const systemAttributeLabels: Record<string, { ru: string; en: string }> = {
  formula_version: { ru: "Версия формулы цены", en: "Price formula version" },
  price_formula: {
    ru: "Формула расчёта цены",
    en: "Price calculation formula",
  },
  stock_quantity: { ru: "Остаток на складе", en: "Stock quantity" },
};

interface IAttributeProps {
  attribute: TAttribute;
  language: string;
  onAction: (action: TAction) => Promise<boolean>;
  onRemove: (id: string, offerId: string) => void;
  busy: boolean;
  editable: boolean;
  refreshRevision: number;
}

const AttributeRow = memo(function AttributeRow({
  attribute,
  language,
  onAction,
  onRemove,
  busy,
  editable,
  refreshRevision,
}: IAttributeProps) {
  const ru = language === "ru";
  const id = useId();
  const [draft, setDraft] = useState<{
    value: TValue;
    expectedUpdatedAt: string;
    refreshRevision: number;
  }>();
  const value = draft?.value ?? attribute.value ?? "";
  const isText = attribute.field === "string";
  const baseEntries =
    typeof attribute.value === "object" ? attribute.value : {};
  const draftEntries = typeof draft?.value === "object" ? draft.value : {};
  const entries = { ...baseEntries, ...draftEntries };
  const label =
    systemAttributeLabels[attribute.key]?.[ru ? "ru" : "en"] ??
    (attribute.label || attribute.key);
  function changeValue(value: TValue) {
    setDraft((before) => ({
      value,
      expectedUpdatedAt:
        before?.refreshRevision === refreshRevision
          ? before.expectedUpdatedAt
          : attribute.updatedAt,
      refreshRevision,
    }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !attribute.offerId) return;
    const expectedUpdatedAt =
      draft.refreshRevision === refreshRevision
        ? draft.expectedUpdatedAt
        : attribute.updatedAt;
    const nextValue =
      typeof draft.value === "string"
        ? draft.value.replace(",", ".")
        : Object.fromEntries(
            Object.entries(entries).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          );
    if (
      await onAction({
        kind: "update-attribute",
        offerId: attribute.offerId,
        id: attribute.id,
        value: nextValue,
        expectedUpdatedAt,
      })
    ) {
      setDraft(undefined);
    }
  }

  return (
    <li
      className="grid min-w-0 gap-2 rounded-lg border border-border p-3"
      aria-busy={busy}
    >
      <h3 className="break-words text-sm font-medium" id={id}>
        {label}
      </h3>
      {editable && attribute.editable ? (
        <form
          className="grid min-w-0 gap-2"
          onSubmit={save}
          aria-labelledby={id}
        >
          {isText ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {internationalization.languages.map(({ code, title }) => (
                <label key={code} className={settingsFormStyles.label}>
                  {ru && code === "ru"
                    ? "Русский"
                    : ru && code === "en"
                      ? "Английский"
                      : title}
                  <Input
                    className={settingsFormStyles.field}
                    value={entries[code] ?? ""}
                    onChange={(event) =>
                      changeValue({
                        ...draftEntries,
                        [code]: event.currentTarget.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          ) : (
            <Input
              className={settingsFormStyles.field}
              aria-label={label}
              required
              inputMode="decimal"
              pattern="-?[0-9]+([.,][0-9]+)?"
              value={typeof value === "string" ? value : ""}
              onChange={(event) => changeValue(event.currentTarget.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              className={`${settingsFormStyles.secondary} w-fit`}
              type="submit"
              variant="outline"
              disabled={!draft}
            >
              {ru ? "Сохранить" : "Save"}
            </Button>
            {draft && (
              <Button
                className={`${settingsFormStyles.button} w-fit border-transparent`}
                type="button"
                variant="ghost"
                onClick={() => setDraft(undefined)}
              >
                {ru ? "Сбросить" : "Reset"}
              </Button>
            )}
            <Button
              className={`${settingsFormStyles.button} w-fit border-transparent`}
              type="button"
              variant="ghost"
              onClick={() =>
                attribute.offerId && onRemove(attribute.id, attribute.offerId)
              }
            >
              {ru ? "Удалить связь" : "Remove link"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="break-words text-sm text-muted-foreground">
          {(typeof value === "string"
            ? value
            : localizedText(value, language)) || "—"}
        </p>
      )}
    </li>
  );
});

interface IProps {
  subjectId: string;
  storeId: string;
  offers: IStoreProductOffer[];
  selectedOfferId?: string;
  onOfferChange: (id: string) => void;
  offerLocked: boolean;
  attributes: TAttribute[];
  options: IStoreProductRelations["attributeOptions"];
  language: string;
  pendingKey?: string;
  refreshRevision: number;
  onAction: IAttributeProps["onAction"];
  onRemove: IAttributeProps["onRemove"];
}

export function Attributes({
  subjectId,
  storeId,
  offers,
  selectedOfferId,
  onOfferChange,
  offerLocked,
  attributes,
  options,
  language,
  pendingKey,
  refreshRevision,
  onAction,
  onRemove,
}: IProps) {
  const ru = language === "ru";
  const headingId = useId();
  const [keyId, setKeyId] = useState("");
  const [draft, setDraft] = useState("");
  const offer = offers.find(({ id }) => id === selectedOfferId);
  const common = attributes.filter((attribute) => !attribute.offerId);
  const scoped = offer
    ? attributes.filter((attribute) => attribute.offerId === offer.id)
    : [];
  const available = options.filter(
    ({ key }) => !scoped.some((attribute) => attribute.key === key),
  );
  const selected = available.find(({ id }) => id === keyId);

  async function addAttribute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft.trim() || !offer?.editable) return;
    const value =
      selected.field === "string"
        ? { [language]: draft.trim() }
        : draft.trim().replace(",", ".");
    if (
      await onAction({ kind: "add-attribute", offerId: offer.id, keyId, value })
    ) {
      setKeyId("");
      setDraft("");
    }
  }

  return (
    <section
      className={`${settingsFormStyles.panel} grid gap-5`}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={settingsFormStyles.title}>
        {ru ? "Характеристики" : "Attributes"}
      </h2>
      {common.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-sm font-medium">
            {ru ? "Общие характеристики товара" : "Shared product attributes"}
          </h3>
          <ul className="grid gap-2">
            {common.map((attribute) => (
              <AttributeRow
                key={attribute.id}
                attribute={attribute}
                language={language}
                editable={false}
                busy={false}
                refreshRevision={refreshRevision}
                onAction={onAction}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </div>
      )}
      {offer && (
        <label className={settingsFormStyles.label}>
          {ru ? "Предложение магазина" : "Store offer"}
          {offers.length > 1 ? (
            <Select
              ui="shadcn"
              className={settingsFormStyles.field}
              aria-label={
                ru ? "Предложение для характеристик" : "Offer for attributes"
              }
              value={offer.id}
              disabled={offerLocked || Boolean(draft)}
              onValueChange={(id) => {
                setKeyId("");
                setDraft("");
                onOfferChange(id);
              }}
              options={offers.map(({ id, sku, configurationKey }) => ({
                value: id,
                label: configurationKey ? `${configurationKey} · ${sku}` : sku,
              }))}
            />
          ) : (
            <span>{offer.sku}</span>
          )}
        </label>
      )}
      {scoped.length ? (
        <ul className="grid min-w-0 gap-2">
          {scoped.map((attribute) => (
            <AttributeRow
              key={attribute.id}
              attribute={attribute}
              language={language}
              editable={Boolean(offer?.editable)}
              busy={pendingKey === attribute.id}
              refreshRevision={refreshRevision}
              onAction={onAction}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : (
        offer && (
          <p className="text-sm text-muted-foreground">
            {ru
              ? "У предложения пока нет характеристик."
              : "This offer has no attributes yet."}
          </p>
        )
      )}
      {offer?.editable && (
        <DirectoryPicker
          subjectId={subjectId}
          storeId={storeId}
          kind="attributes"
          language={language}
          label={ru ? "Добавить из справочника" : "Add from directory"}
          disabledIds={scoped.map(({ attributeId }) => attributeId)}
          onSelect={({ id }) =>
            void onAction({
              kind: "attach-attribute",
              offerId: offer.id,
              attributeId: id,
            })
          }
        />
      )}
      {offer?.editable && !!available.length && (
        <form
          className="grid min-w-0 items-end gap-2 sm:grid-cols-2"
          onSubmit={addAttribute}
        >
          <Select
            className={settingsFormStyles.field}
            ui="shadcn"
            aria-label={ru ? "Новая характеристика" : "New attribute"}
            placeholder={ru ? "Выбрать характеристику" : "Choose an attribute"}
            value={selected?.id ?? ""}
            onValueChange={(id) => {
              setKeyId(id);
              setDraft("");
            }}
            options={available.map(({ id, label, key }) => ({
              value: id,
              label: label || key,
            }))}
          />
          {selected && (
            <>
              <Input
                className={settingsFormStyles.field}
                required
                aria-label={ru ? "Значение характеристики" : "Attribute value"}
                inputMode={selected.field === "number" ? "decimal" : "text"}
                pattern={
                  selected.field === "number"
                    ? "-?[0-9]+([.,][0-9]+)?"
                    : undefined
                }
                value={draft}
                onChange={(event) => setDraft(event.currentTarget.value)}
              />
              <Button
                type="submit"
                variant="outline"
                className={`${settingsFormStyles.secondary} w-fit justify-self-start`}
              >
                {ru ? "Добавить характеристику" : "Add attribute"}
              </Button>
            </>
          )}
        </form>
      )}
    </section>
  );
}
