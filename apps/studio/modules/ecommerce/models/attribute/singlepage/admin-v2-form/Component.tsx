import { useState } from "react";
import {
  Button,
  Checkbox,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { RecordForm } from "../../../../../../workspace/design/singlepage/interface-kit/Records";
import { studioAttributes, type IStudioAttribute } from "../../shared";

export interface IAttributeAdminFormProps {
  attribute?: IStudioAttribute;
  onSave?: (attribute: IStudioAttribute) => void;
  embedded?: boolean;
}

export function EcommerceAttributeAdminV2Form({
  attribute = studioAttributes[0],
  onSave,
  embedded = false,
}: IAttributeAdminFormProps = {}) {
  const [draft, setDraft] = useState(attribute);
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("");
  const datetime = draft.datetime ? new Date(draft.datetime) : null;
  const datetimeValue = datetime
    ? `${datetime.getFullYear()}-${String(datetime.getMonth() + 1).padStart(2, "0")}-${String(datetime.getDate()).padStart(2, "0")}T${String(datetime.getHours()).padStart(2, "0")}:${String(datetime.getMinutes()).padStart(2, "0")}`
    : "";
  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : `${kit.card} overflow-hidden p-0`
      }
      data-ds-block="ecommerce.attribute.admin-v2-form"
      data-ds-layer="singlepage"
    >
      {!embedded && (
        <header className="border-b border-[var(--workspace-brand-line)] p-5 sm:p-6">
          <p className={`text-xs ${kit.muted}`}>ecommerce / attribute</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {attribute.id ? "Edit attribute" : "New attribute"}
          </h2>
        </header>
      )}
      <RecordForm
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(draft);
          setStatus("Attribute saved locally.");
        }}
        footer={
          <>
            <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
              {status || "Local preview"}
            </p>
            <Button type="submit">
              <Icon name="floppy-disk" />
              {attribute.id ? "Save attribute" : "Create attribute"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          {attribute.id && (
            <p className={`break-all text-xs ${kit.muted}`}>
              ID: {attribute.id}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Admin title</span>
              <input
                className={kit.field}
                required
                value={draft.adminTitle}
                onChange={(event) =>
                  setDraft({ ...draft, adminTitle: event.target.value })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
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
          </div>
          <fieldset className="grid min-w-0 gap-4 rounded-2xl border border-[var(--workspace-brand-line)] p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold">String</legend>
            <label className="grid max-w-xs gap-2 text-sm">
              <span className={kit.label}>Language</span>
              <Select
                value={language}
                onValueChange={setLanguage}
                options={[
                  { value: "en", label: "English" },
                  { value: "ru", label: "Русский" },
                ]}
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>
                String · {language.toUpperCase()}
              </span>
              <input
                className={kit.field}
                value={draft.string[language] ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    string: { ...draft.string, [language]: event.target.value },
                  })
                }
              />
            </label>
          </fieldset>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Number</span>
              <input
                type="number"
                step="any"
                className={kit.field}
                value={draft.number ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, number: event.target.value || null })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Variant</span>
              <Select
                value={draft.variant}
                onValueChange={(variant) => setDraft({ ...draft, variant })}
                options={[{ value: "default", label: "Default" }]}
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Date</span>
              <input
                type="date"
                className={`${kit.field} min-w-0`}
                value={draft.date?.slice(0, 10) ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    date: event.target.value
                      ? `${event.target.value}T00:00:00.000Z`
                      : null,
                  })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Datetime</span>
              <input
                type="datetime-local"
                className={`${kit.field} min-w-0`}
                value={datetimeValue}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    datetime: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  })
                }
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={draft.boolean ?? false}
              onChange={(event) =>
                setDraft({ ...draft, boolean: event.target.checked })
              }
            />
            Boolean
          </label>
        </div>
      </RecordForm>
    </section>
  );
}
