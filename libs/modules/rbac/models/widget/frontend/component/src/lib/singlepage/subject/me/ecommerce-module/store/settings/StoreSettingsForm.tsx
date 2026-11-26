"use client";

import {
  variants as storeVariants,
  type IModel as IEcommerceModuleStore,
} from "@sps/ecommerce/models/store/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { getRichTextEditorValue } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import {
  Button,
  Form,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  settingsFormStyles,
} from "@sps/shared-ui-shadcn";
import { FormField, Select } from "@sps/ui-adapter";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { storeSectionHref } from "../paths";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";

interface IStoreSettingsFormProps {
  ecommerceModuleStore: IEcommerceModuleStore;
  subjectId: string;
  language: string;
}

const textFields = ["title", "shortDescription", "description"] as const;
type TStoreText = (typeof textFields)[number];
type TEditableFields = Pick<
  IEcommerceModuleStore,
  "slug" | "adminTitle" | "variant" | TStoreText
>;

const variantNames: Record<string, [string, string]> = {
  default: ["Обычный", "Standard"],
  hidden: ["Скрытый", "Hidden"],
  delivery: ["Доставка", "Delivery"],
  service: ["Услуги", "Services"],
};

function FormattedDescription({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const form = useForm({ values: { description: value } });
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        name: "description",
        formState: { values: true },
        callback: ({ values }) => {
          if (values.description !== value) onChange(values.description);
        },
      }),
    [subscribe, value, onChange],
  );

  return (
    <Form {...form}>
      <FormField
        ui="shadcn"
        type="tiptap"
        name="description"
        label={label}
        form={form}
        labelClassName="text-sm font-semibold"
      />
    </Form>
  );
}

export function StoreSettingsForm({
  ecommerceModuleStore: store,
  subjectId,
  language,
}: IStoreSettingsFormProps) {
  const ru = language === "ru";
  const router = useRouter();
  const update = api.ecommerceModuleCatalogMutation();
  const [refreshing, startRefresh] = useTransition();
  const busy = update.isPending || refreshing;
  const [draft, setDraft] = useState<Partial<TEditableFields>>({});
  const [draftVersion, setDraftVersion] = useState<string>();
  const [stale, setStale] = useState(false);
  const version = store.updatedAt
    ? new Date(store.updatedAt).toISOString()
    : undefined;
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const values = { ...store, ...draft };
  const changes: Partial<TEditableFields> = {};
  for (const field of ["adminTitle", "slug", "variant"] as const) {
    const value = draft[field]?.trim();
    if (value !== undefined && value !== store[field]) changes[field] = value;
  }
  for (const field of textFields) {
    const edits = Object.entries(draft[field] ?? {}).filter(
      ([code, value]) => value !== (store[field]?.[code] ?? ""),
    );
    if (edits.length)
      changes[field] = { ...store[field], ...Object.fromEntries(edits) };
  }
  const dirty = Object.keys(changes).length > 0;
  const languages = internationalization.languages;
  const activeLanguage = languages.some(({ code }) => code === language)
    ? language
    : internationalization.defaultLanguage.code;
  const variants = storeVariants.includes(store.variant)
    ? storeVariants
    : [...storeVariants, store.variant];

  function change(fields: Partial<TEditableFields>) {
    if (!dirty) setDraftVersion(version);
    setDraft((previous) => ({ ...previous, ...fields }));
    setSaved(false);
    setError("");
  }

  function changeText(field: TStoreText, locale: string, value: string) {
    change({ [field]: { ...draft[field], [locale]: value } });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || busy || stale) return;
    if (!values.adminTitle.trim() || !values.slug.trim()) {
      setError(
        ru
          ? "Укажите внутреннее название и адрес магазина."
          : "Enter an internal name and a store URL slug.",
      );
      return;
    }
    if (
      changes.slug &&
      (/[/\\]/u.test(changes.slug) ||
        changes.slug === "." ||
        changes.slug === "..")
    ) {
      setError(
        ru
          ? "Укажите адрес магазина одним сегментом пути."
          : "Enter the store slug as a single URL path segment.",
      );
      return;
    }
    setError("");
    try {
      const expectedUpdatedAt = draftVersion ?? version;
      const result = await update.mutateAsync({
        id: subjectId,
        data: {
          entity: "stores",
          method: "PATCH",
          recordId: store.id,
          ...(expectedUpdatedAt && { expectedUpdatedAt }),
          data: changes,
        },
      });
      const savedSlug =
        typeof result.slug === "string" ? result.slug : changes.slug;
      startRefresh(() => {
        if (savedSlug && savedSlug !== store.slug) {
          router.replace(storeSectionHref(language, savedSlug, "settings"));
        } else {
          router.refresh();
        }
        setDraft({});
        setDraftVersion(undefined);
        setSaved(true);
      });
    } catch (failure) {
      const conflictMessage =
        hasStatus(failure, 409) && failure instanceof Error
          ? failure.message
          : "";
      if (conflictMessage === "Conflict error. Store settings have changed") {
        setStale(true);
        return;
      }
      if (
        changes.slug &&
        conflictMessage === "Conflict error. Entity already exists"
      ) {
        setError(
          ru
            ? "Этот адрес магазина уже занят. Выберите другой."
            : "That store URL is already in use. Choose another.",
        );
        return;
      }
      setError(
        hasStatus(failure, 403)
          ? ru
            ? "У вас нет прав менять настройки этого магазина."
            : "You do not have permission to change this store’s settings."
          : ru
            ? "Не удалось сохранить настройки магазина."
            : "Could not save the store settings.",
      );
    }
  }

  function refreshDraft() {
    startRefresh(() => {
      router.refresh();
      setDraftVersion(undefined);
      setStale(false);
    });
  }

  return (
    <form
      onSubmit={save}
      className={settingsFormStyles.panel}
      aria-labelledby="store-settings-title"
    >
      <section>
        <h2 className={settingsFormStyles.title} id="store-settings-title">
          {ru ? "Настройки магазина" : "Store settings"}
        </h2>
        <fieldset
          className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"
          disabled={busy}
        >
          <label className={settingsFormStyles.label}>
            {ru ? "Внутреннее название" : "Internal name"}
            <Input
              className={settingsFormStyles.field}
              value={values.adminTitle}
              required
              onChange={(event) =>
                change({ adminTitle: event.currentTarget.value })
              }
            />
          </label>
          <label className={settingsFormStyles.label}>
            {ru ? "Тип магазина" : "Store type"}
            <Select
              ui="shadcn"
              className={settingsFormStyles.field}
              aria-label={ru ? "Тип магазина" : "Store type"}
              value={values.variant}
              disabled={busy}
              options={variants.map((value) => ({
                value,
                label: variantNames[value]?.[ru ? 0 : 1] ?? value,
              }))}
              onValueChange={(variant) => change({ variant })}
            />
          </label>
          <label className={settingsFormStyles.label}>
            {ru ? "Адрес магазина" : "Store URL slug"}
            <Input
              className={settingsFormStyles.field}
              value={values.slug}
              required
              aria-label={ru ? "Адрес магазина" : "Store URL slug"}
              aria-describedby="store-url-preview"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => change({ slug: event.currentTarget.value })}
            />
            <span
              id="store-url-preview"
              className="break-all text-xs font-normal text-muted-foreground"
            >
              {storeSectionHref(language, values.slug, "overview")}
            </span>
          </label>
        </fieldset>
      </section>
      <section
        className="mt-6 border-t border-border pt-6"
        aria-labelledby="store-texts-title"
      >
        <h2 id="store-texts-title" className="text-base font-semibold">
          {ru ? "Тексты магазина" : "Store content"}
        </h2>
        <Tabs defaultValue={activeLanguage} className="mt-5 min-w-0">
          <TabsList
            aria-label={ru ? "Язык текстов" : "Content language"}
            className="h-auto max-w-full flex-wrap justify-start"
          >
            {languages.map(({ code, title }) => (
              <TabsTrigger key={code} value={code}>
                {ru && code === "ru"
                  ? "Русский"
                  : ru && code === "en"
                    ? "Английский"
                    : title}
              </TabsTrigger>
            ))}
          </TabsList>
          {languages.map(({ code }) => (
            <TabsContent key={code} value={code} className="mt-4">
              <fieldset
                disabled={busy}
                inert={busy}
                className="grid min-w-0 gap-4"
              >
                <label className={settingsFormStyles.label}>
                  {ru ? "Название" : "Name"}
                  <Input
                    className={settingsFormStyles.field}
                    value={draft.title?.[code] ?? store.title?.[code] ?? ""}
                    onChange={(event) =>
                      changeText("title", code, event.currentTarget.value)
                    }
                  />
                </label>
                <label className={settingsFormStyles.label}>
                  {ru ? "Краткое описание" : "Short description"}
                  <Textarea
                    className={settingsFormStyles.textarea}
                    value={
                      draft.shortDescription?.[code] ??
                      store.shortDescription?.[code] ??
                      ""
                    }
                    onChange={(event) =>
                      changeText(
                        "shortDescription",
                        code,
                        event.currentTarget.value,
                      )
                    }
                  />
                </label>
                <FormattedDescription
                  key={store.description?.[code] ?? ""}
                  label={ru ? "Описание" : "Description"}
                  value={getRichTextEditorValue(
                    draft.description?.[code] ??
                      store.description?.[code] ??
                      "",
                  )}
                  onChange={(value) => changeText("description", code, value)}
                />
              </fieldset>
            </TabsContent>
          ))}
        </Tabs>
      </section>
      <div className={settingsFormStyles.actions}>
        {stale && (
          <>
            <p role="alert" className="text-sm">
              {ru
                ? "Настройки магазина изменились. Загрузите актуальные данные, чтобы проверить и сохранить свои правки."
                : "Store settings have changed. Load the latest settings to review and save your edits."}
            </p>
            <Button
              type="button"
              variant="outline"
              className={settingsFormStyles.secondary}
              disabled={busy}
              onClick={refreshDraft}
            >
              {ru ? "Загрузить актуальные данные" : "Load latest settings"}
            </Button>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm">
            {ru ? "Настройки сохранены." : "Settings saved."}
          </p>
        )}
        <Button
          type="submit"
          className={settingsFormStyles.primary}
          disabled={!dirty || busy || stale}
        >
          {update.isPending
            ? ru
              ? "Сохраняем…"
              : "Saving…"
            : ru
              ? "Сохранить изменения"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
