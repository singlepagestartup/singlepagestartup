"use client";

import { useId, useState } from "react";
import { entityMetadataSchema } from "@sps/shared-utils/metadata";
import type { IComponentProps } from "./interface";

export function Component({
  value,
  language = "en",
  onChange,
  onValidityChange,
}: IComponentProps) {
  const id = useId();
  const [locale, setLocale] = useState(language);
  const [json, setJson] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const update = (
    field: "title" | "description" | "keywords",
    input: string,
  ) => {
    setDrafts((previous) => ({ ...previous, [`${locale}.${field}`]: input }));
    const entry =
      field === "keywords"
        ? [
            ...new Set(
              input
                .split(",")
                .map((word) => word.trim())
                .filter(Boolean),
            ),
          ]
        : input;
    const next = {
      ...value,
      seo: {
        ...value.seo,
        [field]: { ...value.seo?.[field], [locale]: entry },
      },
    };
    const result = entityMetadataSchema.safeParse(next);
    setError(result.success ? "" : result.error.issues[0].message);
    onValidityChange?.(result.success);
    if (result.success) {
      onChange(result.data);
      setJson(undefined);
    }
  };
  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-300 bg-white p-5 text-slate-900">
      <legend className="px-1 text-base font-semibold">SEO metadata</legend>
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        Language
        <select
          aria-label="SEO language"
          className="rounded border border-slate-300 p-2"
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
      </label>
      {(["title", "description", "keywords"] as const).map((field) => (
        <label
          key={field}
          htmlFor={`${id}-${field}`}
          className="flex flex-col gap-1 text-sm"
        >
          {field}
          <textarea
            id={`${id}-${field}`}
            className="min-h-20 rounded border border-slate-300 p-2"
            value={
              drafts[`${locale}.${field}`] ??
              (field === "keywords"
                ? (value.seo?.keywords?.[locale] || []).join(", ")
                : value.seo?.[field]?.[locale] || "")
            }
            onChange={(event) => update(field, event.target.value)}
          />
        </label>
      ))}
      <p className="text-sm text-slate-600">
        Keywords are comma-separated. Missing translations stay empty. Other
        JSON sections are preserved.
      </p>
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          All metadata (JSON)
        </summary>
        <label
          htmlFor={`${id}-json`}
          className="mt-3 flex flex-col gap-1 text-sm"
        >
          Metadata JSON
          <textarea
            id={`${id}-json`}
            className="min-h-48 rounded border border-slate-300 p-2 font-mono text-xs"
            value={json ?? JSON.stringify(value, null, 2)}
            onChange={(event) => {
              setJson(event.target.value);
              try {
                const parsed = entityMetadataSchema.parse(
                  JSON.parse(event.target.value),
                );
                onChange(parsed);
                setDrafts({});
                setError("");
                onValidityChange?.(true);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Invalid metadata JSON",
                );
                onValidityChange?.(false);
              }
            }}
          />
        </label>
      </details>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
