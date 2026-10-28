import { useEffect, useState } from "react";
import { renderMetadataTemplate } from "@sps/shared-utils/metadata";
import type { IComponentProps } from "./interface";

export function Component({
  templates,
  values,
  url = "/ru/blog/example",
  language: initialLanguage = "ru",
  fallbackImage,
  hidden,
}: IComponentProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    let current = true;
    const issues: string[] = [];
    void Promise.all(
      Object.entries(templates || {}).map(async ([field, template]) => {
        try {
          const result = await renderMetadataTemplate(template || "", {
            language,
            list: field === "keywords",
            resolve: (ref) => {
              const key = ref.relations.length
                ? [
                    ref.source,
                    ...ref.relations,
                    `${ref.target}.${ref.path.join(".")}`,
                  ].join(">")
                : `${ref.target}.${ref.path.join(".")}`;
              return values?.[key];
            },
          });
          return [field, result];
        } catch (error) {
          issues.push(
            `${field}: ${error instanceof Error ? error.message : "Unavailable"}`,
          );
          return [field, ""];
        }
      }),
    ).then((entries) => {
      if (current) {
        setPreview(Object.fromEntries(entries));
        setErrors(issues);
      }
    });
    return () => {
      current = false;
    };
  }, [templates, values, language]);
  return (
    <section
      className="grid gap-4 rounded-xl border border-border bg-card p-5"
      aria-label="SEO preview"
      data-module="host"
      data-model="metadata"
      data-variant="seo-preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">SEO preview</h3>
        <label className="flex items-center gap-2 text-sm">
          Language
          <select
            className="rounded border border-border bg-card p-2"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      <p className="break-all text-sm text-muted-foreground">{url}</p>
      {hidden ? (
        <p role="status">Hidden · HTTP 404 · excluded from sitemap</p>
      ) : (
        <>
          <h4 className="text-xl font-semibold">
            {preview.title || "Title is not available"}
          </h4>
          <p>{preview.description || "Description is not available"}</p>
          <p className="text-sm text-muted-foreground">
            Keywords: {preview.keywords || "Not specified"}
          </p>
          {(preview.opengraphImage || fallbackImage) && (
            <p className="break-all text-sm">
              Cover: {preview.opengraphImage || fallbackImage}
            </p>
          )}
        </>
      )}
      {errors.length > 0 && (
        <ul
          role="alert"
          className="list-inside list-disc text-sm text-destructive"
        >
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
