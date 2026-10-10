import { useCallback, useMemo, useState } from "react";
import { HOST_STUDIO_FIELDS } from "../../../../../../workspace/utils/host-studio/constants";
import {
  createHostModel,
  hostFieldValue,
  hostRecordLabel,
  removeHostModels,
  saveHostModel,
  validateHostModel,
  type HostModel,
  type HostRecord,
} from "../../../../../../workspace/utils/host-studio/index";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Records,
  RecordEditor,
  RecordForm,
  type IRecordField,
} from "../../../../../../workspace/design/singlepage/interface-kit/Records";
import { useHostStudio } from "./Context";
import { HostRecordPreview } from "./Preview";

export interface IHostModelListProps {
  model: HostModel;
  embedded?: boolean;
}
export interface IHostModelFormProps {
  model: HostModel;
  record: HostRecord;
  onSaved?: (record: HostRecord) => void;
  embedded?: boolean;
}
export interface IHostModelSelectProps {
  model: HostModel;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}
interface IHostModelPanelProps {
  model: HostModel;
  record: HostRecord | null;
  preview?: boolean;
  onClose: () => void;
  onSaved?: (record: HostRecord) => void;
}

export function HostModelSelect({
  model,
  value,
  onValueChange,
  disabled,
}: IHostModelSelectProps) {
  const { state } = useHostStudio();
  const [local, setLocal] = useState("");
  return (
    <Select
      aria-label={`Select ${model}`}
      value={value ?? local}
      onValueChange={onValueChange ?? setLocal}
      disabled={disabled || state.models[model].length === 0}
      placeholder={
        state.models[model].length ? `Select ${model}` : `No ${model} records`
      }
      options={state.models[model].map((record) => ({
        value: record.id,
        label: hostRecordLabel(record),
      }))}
    />
  );
}
export function HostModelPanel({
  model,
  record,
  preview,
  onClose,
  onSaved,
}: IHostModelPanelProps) {
  const { state } = useHostStudio();
  const exists =
    record && state.models[model].some((item) => item.id === record.id);
  return (
    <RecordEditor
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`${preview ? "Preview" : exists ? "Edit" : "New"} ${model}`}
      description={`Host ${model} fields and connected records. Changes are local to this preview.`}
    >
      {record &&
        (preview ? (
          <div className="p-5">
            <HostRecordPreview model={model} id={record.id} />
          </div>
        ) : (
          <HostModelForm
            key={record.id}
            model={model}
            record={record}
            embedded
            onSaved={(saved) => {
              onSaved?.(saved);
              onClose();
            }}
          />
        ))}
    </RecordEditor>
  );
}
export function HostModelList({ model, embedded }: IHostModelListProps) {
  const { state, update } = useHostStudio();
  const [draft, setDraft] = useState<HostRecord | null>(null);
  const [preview, setPreview] = useState<HostRecord | null>(null);
  const edit = useCallback((record: HostRecord) => setDraft(record), []);
  const showPreview = useCallback(
    (record: HostRecord) => setPreview(record),
    [],
  );
  const remove = useCallback(
    (ids: string[]) =>
      update((current) => removeHostModels(current, model, ids)),
    [model, update],
  );
  const create = useCallback(
    () => setDraft(createHostModel(model, crypto.randomUUID())),
    [model],
  );
  const close = useCallback(() => {
    setDraft(null);
    setPreview(null);
  }, []);
  const fields = useMemo<IRecordField<HostRecord>[]>(
    () =>
      HOST_STUDIO_FIELDS[model].map((key) => ({
        key,
        label: key,
        value: (record) => hostFieldValue(record, key),
      })),
    [model],
  );
  const actions = useMemo(
    () => [
      { label: "Preview", icon: "eye" as const, onAction: showPreview },
      { label: "Edit", icon: "pencil-simple" as const, onAction: edit },
    ],
    [edit, showPreview],
  );
  const listFields = useMemo(
    () =>
      model === "metadata"
        ? fields.filter((field) =>
            ["title", "description", "keywords", "variant"].includes(field.key),
          )
        : fields,
    [fields, model],
  );
  return (
    <div
      data-ds-block={`host.${model}.admin-v2-list`}
      data-ds-layer="singlepage"
    >
      <Records
        title={
          model === "metadata"
            ? "Metadata"
            : `${model[0].toUpperCase()}${model.slice(1)}s`
        }
        scope={`host / ${model}`}
        records={state.models[model]}
        fields={listFields}
        searchFields={fields}
        actions={actions}
        createLabel={`Add ${model}`}
        onCreate={create}
        onRemove={remove}
        removalDescription="Delete these model records and their Host links? Other model records are retained."
        embedded={embedded}
      />
      <HostModelPanel
        model={model}
        record={draft ?? preview}
        preview={Boolean(preview)}
        onClose={close}
      />
    </div>
  );
}
export function HostModelForm({
  model,
  record,
  onSaved,
  embedded = false,
}: IHostModelFormProps) {
  const { state, update } = useHostStudio();
  const [draft, setDraft] = useState(record);
  const [language, setLanguage] = useState("en");
  const [feedback, setFeedback] = useState("");
  const exists = state.models[model].some((item) => item.id === record.id);
  const patch = (key: string, value: string | null) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <section
      className={embedded ? "flex min-h-0 flex-1 flex-col" : `${kit.card} p-0`}
      data-ds-block={`host.${model}.admin-v2-form`}
      data-ds-layer="singlepage"
    >
      {!embedded && (
        <header className="border-b border-[var(--workspace-brand-line)] p-5">
          <h2 className="text-xl font-semibold">
            {exists ? "Edit" : "New"} {model}
          </h2>
        </header>
      )}
      <RecordForm
        onSubmit={(event) => {
          event.preventDefault();
          const error = validateHostModel(state, model, draft);
          if (error) {
            setFeedback(error);
            return;
          }
          const saved = { ...draft, updatedAt: new Date() };
          update((current) => saveHostModel(current, model, saved));
          setFeedback("Saved locally.");
          onSaved?.(saved);
        }}
        footer={
          <>
            <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
              {feedback || "Local preview"}
            </p>
            <Button type="submit">
              <Icon name="floppy-disk" />
              Save {model}
            </Button>
          </>
        }
      >
        <p className={`mb-4 break-all text-xs ${kit.muted}`}>ID: {draft.id}</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {HOST_STUDIO_FIELDS[model].map((key) => (
            <label key={key} className="grid min-w-0 gap-2">
              <span className={kit.label}>{key}</span>
              <input
                className={kit.field}
                value={hostFieldValue(draft, key)}
                required={
                  key === "adminTitle" ||
                  key === "url" ||
                  key === "slug" ||
                  key === "language" ||
                  key === "variant" ||
                  (key === "title" && model !== "layout")
                }
                onChange={(event) =>
                  patch(
                    key,
                    event.target.value ||
                      (key === "className" ||
                      key === "description" ||
                      (model === "metadata" &&
                        key !== "title" &&
                        key !== "variant") ||
                      (model === "layout" && key === "title")
                        ? null
                        : ""),
                  )
                }
              />
            </label>
          ))}
        </div>
        {model === "widget" && "subtitle" in draft && (
          <fieldset className="mt-5 grid gap-4 rounded-xl border border-[var(--workspace-brand-line)] p-4">
            <legend className="px-2 font-semibold">Localized content</legend>
            <label className="grid gap-2">
              <span className={kit.label}>Language</span>
              <input
                className={kit.field}
                required
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              />
            </label>
            {(["title", "subtitle", "description"] as const).map((key) => (
              <label key={key} className="grid gap-2">
                <span className={kit.label}>
                  {key} · {language}
                </span>
                <textarea
                  className={`${kit.field} min-h-24`}
                  value={draft[key]?.[language] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) =>
                      "subtitle" in current
                        ? {
                            ...current,
                            [key]: { ...current[key], [language]: value },
                          }
                        : current,
                    );
                  }}
                />
              </label>
            ))}
          </fieldset>
        )}
      </RecordForm>
    </section>
  );
}
