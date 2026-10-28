import type { IPreviewViewProps } from "./interface";
import { internationalization } from "@sps/shared-configuration";
export function Component({
  id,
  url,
  language,
  setUrl,
  setLanguage,
  onPreview,
  isFetching,
  error,
  result,
  title,
  image,
  indexable,
}: IPreviewViewProps) {
  return (
    <section
      aria-label="SEO preview"
      className="space-y-3 rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-lg font-semibold">SEO preview</h3>
      <label htmlFor={`${id}-url`} className="flex flex-col gap-1 text-sm">
        Page URL
        <input
          id={`${id}-url`}
          className="rounded border border-border bg-background p-2"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/blog/example"
        />
      </label>
      <label htmlFor={`${id}-language`} className="flex flex-col gap-1 text-sm">
        Language
        <select
          id={`${id}-language`}
          className="rounded border border-border bg-background p-2"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {internationalization.languages.map(({ code, title }) => (
            <option key={code} value={code}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
        disabled={!url.startsWith("/") || isFetching}
        onClick={onPreview}
      >
        {isFetching ? "Loading…" : "Preview draft"}
      </button>
      <p className="text-sm text-muted-foreground">
        Uses the public page and current form values. Preview does not save
        changes.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="space-y-2">
          <h4 className="text-xl font-semibold">{title}</h4>
          <p>{result.metadata.description}</p>
          <p className="break-all text-sm text-muted-foreground">
            Canonical: {String(result.metadata.alternates?.canonical || "")}
          </p>
          <p className="text-sm">
            Keywords:{" "}
            {Array.isArray(result.metadata.keywords)
              ? result.metadata.keywords.join(", ")
              : result.metadata.keywords || "Not specified"}
          </p>
          <p className="break-all text-sm">
            Open Graph image: {image || "Not specified"}
          </p>
          <p className="text-sm">
            Indexing: {indexable ? "Allowed" : "noindex"}
          </p>
          {result.diagnostics?.length ? (
            <ul
              role="alert"
              className="list-inside list-disc text-sm text-destructive"
            >
              {result.diagnostics.map((message, index) => (
                <li key={`${index}-${message}`}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
