import { useCallback, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Records,
  RecordEditor,
  RecordForm,
  type IRecordField,
} from "../../../../../workspace/design/singlepage/interface-kit/Records";

interface IArticleRecord {
  id: string;
  adminTitle: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  description: Record<string, string>;
  slug: string;
  variant: string;
  className: string;
}
const initialArticles: IArticleRecord[] = [
  {
    id: "article-studio-storybook",
    adminTitle: "Studio migration",
    title: { en: "Migrating runnable studio into Storybook" },
    subtitle: {},
    description: {},
    slug: "studio-storybook",
    variant: "default",
    className: "",
  },
  {
    id: "article-startup-overrides",
    adminTitle: "Startup overrides",
    title: { en: "Startup overrides without copy-paste" },
    subtitle: {},
    description: {},
    slug: "startup-overrides",
    variant: "default",
    className: "",
  },
  {
    id: "article-relation-surfaces",
    adminTitle: "Relation surfaces",
    title: { en: "Admin-v2 relation surfaces" },
    subtitle: {},
    description: {},
    slug: "relation-surfaces",
    variant: "default",
    className: "",
  },
];
const fields: IRecordField<IArticleRecord>[] = [
  {
    key: "adminTitle",
    label: "Admin title",
    value: (record) => record.adminTitle,
  },
  {
    key: "title",
    label: "Title",
    value: (record) => Object.values(record.title).join(" "),
    displayValue: (record) =>
      record.title.en ?? Object.values(record.title)[0] ?? "",
  },
  { key: "slug", label: "Slug", value: (record) => record.slug },
  { key: "id", label: "ID", value: (record) => record.id },
  { key: "variant", label: "Variant", value: (record) => record.variant },
];
const searchFields = [
  ...fields,
  {
    key: "className",
    label: "Class name",
    value: (record: IArticleRecord) => record.className,
  },
];
const emptyDraft: IArticleRecord = {
  id: "",
  adminTitle: "",
  title: {},
  subtitle: {},
  description: {},
  slug: "",
  variant: "default",
  className: "",
};

export function BlogArticleAdminV2List() {
  const [articles, setArticles] = useState(initialArticles);
  const [preview, setPreview] = useState<IArticleRecord | null>(null);
  const [draft, setDraft] = useState<IArticleRecord | null>(null);
  const [language, setLanguage] = useState("en");
  const [feedback, setFeedback] = useState("");
  const edit = useCallback((record: IArticleRecord) => {
    setDraft(record);
    setLanguage("en");
  }, []);
  const remove = useCallback((ids: string[]) => {
    setArticles((current) =>
      current.filter((record) => !ids.includes(record.id)),
    );
    setFeedback("Selected records removed locally.");
  }, []);
  const actions = useMemo(
    () => [
      {
        label: "Preview",
        icon: "eye" as const,
        onAction: (record: IArticleRecord) => setPreview(record),
      },
      { label: "Edit", icon: "pencil-simple" as const, onAction: edit },
    ],
    [edit],
  );
  return (
    <div data-ds-block="blog.article.admin-v2-list" data-ds-layer="singlepage">
      <Records
        title="Articles"
        scope="blog / article"
        records={articles}
        fields={fields}
        searchFields={searchFields}
        actions={actions}
        createLabel="Add article"
        onCreate={() => {
          setDraft(emptyDraft);
          setLanguage("en");
        }}
        onRemove={remove}
      />
      {feedback && (
        <p role="status" className={`mt-3 text-sm ${kit.muted}`}>
          {feedback}
        </p>
      )}
      <RecordEditor
        open={Boolean(draft || preview)}
        onOpenChange={(open) => {
          if (!open) {
            setDraft(null);
            setPreview(null);
          }
        }}
        title={
          preview
            ? "Article preview"
            : draft?.id
              ? "Edit article"
              : "New article"
        }
        description="Edit the article fields in this local preview."
      >
        {preview && (
          <div className="p-5 sm:p-6">
            <p className={`text-xs ${kit.muted}`}>
              {preview.slug} · {preview.variant}
            </p>
            <h3 className="mt-4 text-3xl font-semibold">
              {preview.title.en || preview.adminTitle}
            </h3>
            {preview.subtitle.en && (
              <p className="mt-3 text-lg">{preview.subtitle.en}</p>
            )}
            <p
              className={`mt-5 whitespace-pre-wrap text-sm leading-6 ${kit.muted}`}
            >
              {preview.description.en || "No description provided."}
            </p>
            <p className={`mt-6 break-all text-xs ${kit.muted}`}>
              {preview.id}
            </p>
          </div>
        )}
        {draft && (
          <RecordForm
            footer={
              <>
                <Dialog.Close asChild>
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit">
                  <Icon name="floppy-disk" />
                  {draft.id ? "Save changes" : "Create article"}
                </Button>
              </>
            }
            onSubmit={(event) => {
              event.preventDefault();
              const saved = {
                ...draft,
                id: draft.id || `article-${crypto.randomUUID()}`,
              };
              setArticles((current) =>
                draft.id
                  ? current.map((record) =>
                      record.id === draft.id ? saved : record,
                    )
                  : [saved, ...current],
              );
              setFeedback(`Saved “${saved.adminTitle}” locally.`);
              setDraft(null);
            }}
          >
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className={kit.label}>Admin title</span>
                  <input
                    autoFocus
                    className={kit.field}
                    required
                    value={draft.adminTitle}
                    onChange={(event) =>
                      setDraft({ ...draft, adminTitle: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className={kit.label}>Slug</span>
                  <input
                    className={kit.field}
                    required
                    pattern="[a-z0-9-]+"
                    value={draft.slug}
                    onChange={(event) =>
                      setDraft({ ...draft, slug: event.target.value })
                    }
                  />
                </label>
                <div className="grid gap-2">
                  <span className={kit.label}>Variant</span>
                  <Select
                    aria-label="Variant"
                    value={draft.variant}
                    onValueChange={(variant) => setDraft({ ...draft, variant })}
                    options={[{ value: "default", label: "Default" }]}
                  />
                </div>
                <label className="grid gap-2">
                  <span className={kit.label}>Class name</span>
                  <input
                    className={kit.field}
                    value={draft.className}
                    onChange={(event) =>
                      setDraft({ ...draft, className: event.target.value })
                    }
                  />
                </label>
              </div>
              <fieldset className="grid gap-4 rounded-2xl bg-[var(--workspace-brand-background)] p-4 sm:p-5">
                <legend className="sr-only">Localized content</legend>
                <h3 className="font-semibold">Localized content</h3>
                <div className="grid max-w-xs gap-2">
                  <span className={kit.label}>Language</span>
                  <Select
                    aria-label="Language"
                    value={language}
                    onValueChange={setLanguage}
                    options={[
                      { value: "en", label: "English" },
                      { value: "ru", label: "Русский" },
                    ]}
                  />
                </div>
                {(["title", "subtitle", "description"] as const).map((name) => (
                  <label key={name} className="grid gap-2">
                    <span className={kit.label}>
                      {name[0].toUpperCase() + name.slice(1)} ·{" "}
                      {language.toUpperCase()}
                    </span>
                    {name === "description" ? (
                      <textarea
                        className={`${kit.field} min-h-32`}
                        value={draft[name][language] ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [name]: {
                              ...draft[name],
                              [language]: event.target.value,
                            },
                          })
                        }
                      />
                    ) : (
                      <input
                        className={kit.field}
                        value={draft[name][language] ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [name]: {
                              ...draft[name],
                              [language]: event.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            </div>
          </RecordForm>
        )}
      </RecordEditor>
    </div>
  );
}
