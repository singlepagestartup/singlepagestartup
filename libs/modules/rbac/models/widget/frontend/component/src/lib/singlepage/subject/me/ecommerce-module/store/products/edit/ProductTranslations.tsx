import { internationalization } from "@sps/shared-configuration";
import {
  settingsFormStyles,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TipTapEditor,
} from "@sps/shared-ui-shadcn";
import type { IStoreProduct } from "@sps/rbac/models/subject/sdk/model";
import { useId, type Ref } from "react";

const fields = ["title", "shortDescription", "description"] as const;
type TField = (typeof fields)[number];
export type TProductTranslations = Record<
  string,
  Partial<Record<TField, string>>
>;

interface IProps {
  product: Pick<IStoreProduct["product"], TField>;
  language: string;
  drafts: TProductTranslations;
  titleError: boolean;
  disabled?: boolean;
  titleInputRef: Ref<HTMLInputElement>;
  onChange: (locale: string, field: TField, value: string) => void;
}

export function translationChanges(
  product: IProps["product"],
  drafts: TProductTranslations,
) {
  const changes: TProductTranslations = {};
  for (const [locale, entry] of Object.entries(drafts)) {
    for (const field of fields) {
      const value = entry[field]?.trim();
      if (value !== undefined && value !== (product[field]?.[locale] ?? "")) {
        changes[locale] ??= {};
        changes[locale][field] = value;
      }
    }
  }
  return changes;
}

export function ProductTranslations({
  product,
  language,
  drafts,
  titleError,
  disabled,
  titleInputRef,
  onChange,
}: IProps) {
  const ru = language === "ru";
  const titleErrorId = useId();
  const locales = internationalization.languages;
  const selected = locales.some(({ code }) => code === language)
    ? language
    : internationalization.defaultLanguage.code;

  return (
    <section
      className={`${settingsFormStyles.panel} grid gap-5`}
      aria-labelledby="product-translations-title"
    >
      <h2 id="product-translations-title" className={settingsFormStyles.title}>
        {ru ? "Тексты товара" : "Product content"}
      </h2>
      <Tabs defaultValue={selected} className="min-w-0">
        <TabsList
          aria-label={ru ? "Язык карточки" : "Product language"}
          className="h-auto max-w-full flex-wrap justify-start"
        >
          {locales.map(({ code, title }) => (
            <TabsTrigger key={code} value={code}>
              {code === "ru" && ru
                ? "Русский"
                : code === "en" && ru
                  ? "Английский"
                  : title}
            </TabsTrigger>
          ))}
        </TabsList>
        {locales.map(({ code }) => (
          <TabsContent key={code} value={code} className="mt-4 grid gap-4">
            <label className={settingsFormStyles.label}>
              {ru ? "Название" : "Name"}
              <Input
                className={settingsFormStyles.field}
                ref={titleInputRef}
                maxLength={180}
                value={drafts[code]?.title ?? product.title?.[code] ?? ""}
                aria-invalid={titleError}
                aria-describedby={titleError ? titleErrorId : undefined}
                onChange={(event) =>
                  onChange(code, "title", event.currentTarget.value)
                }
              />
            </label>
            <label className={settingsFormStyles.label}>
              {ru ? "Краткое описание" : "Short description"}
              <Textarea
                className={settingsFormStyles.textarea}
                maxLength={500}
                value={
                  drafts[code]?.shortDescription ??
                  product.shortDescription?.[code] ??
                  ""
                }
                onChange={(event) =>
                  onChange(code, "shortDescription", event.currentTarget.value)
                }
              />
            </label>
            <div className={settingsFormStyles.label}>
              <span>{ru ? "Описание" : "Description"}</span>
              <TipTapEditor
                language={language}
                disabled={disabled}
                label={ru ? "Описание" : "Description"}
                className="min-h-36 font-normal"
                value={
                  drafts[code]?.description ?? product.description?.[code] ?? ""
                }
                onValueChange={(value, empty) =>
                  onChange(code, "description", empty ? "" : value)
                }
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {titleError && (
        <p id={titleErrorId} role="alert" className="text-sm text-destructive">
          {ru
            ? "Укажите название хотя бы на одном языке"
            : "Enter a name in at least one language"}
        </p>
      )}
    </section>
  );
}
