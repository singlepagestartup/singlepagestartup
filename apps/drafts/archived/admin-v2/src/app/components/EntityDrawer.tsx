import React, { useState, useEffect, useCallback } from "react";
import { api, Field, Record as DataRecord } from "../data";
import { RelationManager } from "./RelationManager";
import { X, Save } from "lucide-react";
import { cn } from "../../lib/utils";
import { TipTapEditor } from "./TipTapEditor";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";

interface EntityDrawerProps {
  moduleSlug: string;
  modelSlug: string;
  recordId: string;
  level: number;
  onClose: () => void;
}

export function EntityDrawer({
  moduleSlug,
  modelSlug,
  recordId,
  level,
  onClose,
}: EntityDrawerProps) {
  const isNew = recordId === "new";
  const [record, setRecord] = useState<DataRecord>({} as DataRecord);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "relations">(
    "details",
  );
  const [activeRelationIdx, setActiveRelationIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  // Animated close: set open=false first, then call onClose after animation
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  // Stacked entity drawer (for opening related entities)
  const [stackedEntity, setStackedEntity] = useState<{
    moduleSlug: string;
    modelSlug: string;
    recordId: string;
  } | null>(null);

  const model = api.getModel(moduleSlug, modelSlug);

  useEffect(() => {
    setActiveTab("details");
    setActiveRelationIdx(0);
    setStackedEntity(null);
    if (!model) return;
    if (isNew) {
      setRecord({} as DataRecord);
      setLoading(false);
    } else {
      const data = api.getRecord(modelSlug, recordId);
      if (data) setRecord(data);
      setLoading(false);
    }
  }, [moduleSlug, modelSlug, recordId, isNew]);

  if (!model || loading) return null;

  const handleChange = (field: string, value: any) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocalizedChange = (
    field: string,
    lang: "en" | "ru",
    value: string,
  ) => {
    setRecord((prev) => ({
      ...prev,
      [field]: { ...(prev[field] || {}), [lang]: value },
    }));
  };

  const handleSave = () => {
    if (isNew) {
      api.createRecord(modelSlug, record);
    } else {
      api.updateRecord(modelSlug, recordId, record);
    }
    handleClose();
  };

  const copyId = () => {
    navigator.clipboard.writeText(recordId);
  };

  const editableFields = model.fields.filter((f) => !f.readonly);
  const hasRelations = !isNew && model.relations && model.relations.length > 0;

  const relationsCount = hasRelations
    ? model.relations!.reduce(
        (acc, rel) =>
          acc + api.getRelatedRecords(modelSlug, recordId, rel).length,
        0,
      )
    : 0;

  const handleOpenEntity = (
    tModuleSlug: string,
    tModelSlug: string,
    tRecordId: string,
  ) => {
    setStackedEntity({
      moduleSlug: tModuleSlug,
      modelSlug: tModelSlug,
      recordId: tRecordId,
    });
  };

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-3xl p-0 gap-0 [&>button.absolute]:hidden sm:max-w-3xl"
          style={{ right: stackedEntity ? "40px" : undefined }}
          onInteractOutside={(e) => {
            if (stackedEntity) e.preventDefault();
          }}
        >
          <SheetTitle className="sr-only">
            {isNew ? `Create ${model?.name}` : `Update ${model?.name}`}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Entity editor drawer
          </SheetDescription>
          {/* Header */}
          <header className="border-b border-border bg-white px-6 pb-4 pt-6">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl tracking-tight">
                  {isNew ? `Create ${model.name}` : `Update ${model.name}`}
                </h2>
                {!isNew && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyId}
                      className="rounded border border-slate-300 bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-slate-100"
                      aria-label="Copy id"
                    >
                      {recordId}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-2 transition hover:bg-muted"
                aria-label="Close editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b border-border bg-white px-6 py-4">
            <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={cn(
                  "rounded border px-3 py-1.5 text-sm transition",
                  activeTab === "details"
                    ? "border-slate-300 bg-white"
                    : "border-transparent text-muted-foreground",
                )}
              >
                Details
              </button>
              {hasRelations && (
                <button
                  type="button"
                  onClick={() => setActiveTab("relations")}
                  className={cn(
                    "rounded border px-3 py-1.5 text-sm transition",
                    activeTab === "relations"
                      ? "border-slate-300 bg-white"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  Relations
                  <span className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">
                    {relationsCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#f1f5f9]">
            {activeTab === "details" && (
              <div className="space-y-6">
                {editableFields.map((field) => (
                  <FieldInput
                    key={field.name}
                    field={field}
                    record={record}
                    onChange={handleChange}
                    onLocalizedChange={handleLocalizedChange}
                  />
                ))}
                {editableFields.length === 0 && (
                  <div className="text-sm text-slate-400 italic text-center py-8">
                    No editable fields.
                  </div>
                )}
              </div>
            )}

            {activeTab === "relations" && hasRelations && (
              <div className="space-y-4">
                {/* Relation sub-tabs */}
                <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
                  {model.relations!.map((rel, idx) => {
                    const count = api.getRelatedRecords(
                      modelSlug,
                      recordId,
                      rel,
                    ).length;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveRelationIdx(idx)}
                        className={cn(
                          "rounded border px-3 py-1.5 text-sm transition",
                          activeRelationIdx === idx
                            ? "border-slate-300 bg-white"
                            : "border-transparent text-muted-foreground",
                        )}
                      >
                        {rel.label}
                        <span className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <RelationManager
                  key={`${modelSlug}-${recordId}-${activeRelationIdx}`}
                  sourceModelSlug={modelSlug}
                  sourceRecordId={recordId}
                  relation={model.relations![activeRelationIdx]}
                  level={level}
                  onOpenEntity={handleOpenEntity}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-end gap-3 border-t border-border bg-white p-6">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Cancel
            </button>
            {activeTab === "details" && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isNew ? "Create" : "Save Changes"}
              </button>
            )}
          </footer>
        </SheetContent>
      </Sheet>

      {/* Stacked entity drawer (recursive) */}
      {stackedEntity && (
        <EntityDrawer
          moduleSlug={stackedEntity.moduleSlug}
          modelSlug={stackedEntity.modelSlug}
          recordId={stackedEntity.recordId}
          level={level + 1}
          onClose={() => setStackedEntity(null)}
        />
      )}
    </>
  );
}

// ── Field renderer ────────────────────────────────────────────────────────────

interface FieldInputProps {
  field: Field;
  record: DataRecord;
  onChange: (field: string, value: any) => void;
  onLocalizedChange: (field: string, lang: "en" | "ru", value: string) => void;
}

function FieldInput({
  field,
  record,
  onChange,
  onLocalizedChange,
}: FieldInputProps) {
  if (field.type === "localized-text") {
    const isRichField =
      field.name === "content" ||
      field.name.toLowerCase().includes("description");
    return (
      <section className="space-y-4 rounded-lg border border-slate-300 bg-white p-4">
        <h3>{field.label}</h3>
        <div className="space-y-2">
          <label className="block text-sm text-slate-600">English</label>
          {isRichField ? (
            <TipTapEditor
              content={record[field.name]?.en || ""}
              onChange={(value) => onLocalizedChange(field.name, "en", value)}
              placeholder={`${field.label} in English`}
            />
          ) : (
            <input
              value={record[field.name]?.en || ""}
              onChange={(e) =>
                onLocalizedChange(field.name, "en", e.target.value)
              }
              placeholder={`${field.label} in English`}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-slate-600">Russian</label>
          {isRichField ? (
            <TipTapEditor
              content={record[field.name]?.ru || ""}
              onChange={(value) => onLocalizedChange(field.name, "ru", value)}
              placeholder={`${field.label} in Russian`}
            />
          ) : (
            <input
              value={record[field.name]?.ru || ""}
              onChange={(e) =>
                onLocalizedChange(field.name, "ru", e.target.value)
              }
              placeholder={`${field.label} in Russian`}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          )}
        </div>
      </section>
    );
  }

  if (field.type === "richtext") {
    return (
      <section className="space-y-2">
        <label className="block text-sm">{field.label}</label>
        <TipTapEditor
          content={record[field.name] || ""}
          onChange={(value) => onChange(field.name, value)}
          placeholder={`Enter ${field.label}...`}
        />
      </section>
    );
  }

  if (field.type === "boolean") {
    return (
      <section className="flex items-center justify-between">
        <label className="text-sm">{field.label}</label>
        <button
          type="button"
          role="switch"
          aria-checked={!!record[field.name]}
          onClick={() => onChange(field.name, !record[field.name])}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
            record[field.name] ? "bg-slate-900" : "bg-slate-200",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              record[field.name] ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <label className="block text-sm">{field.label}</label>
      <input
        type={
          field.type === "number"
            ? "number"
            : field.type === "datetime"
              ? "date"
              : "text"
        }
        value={record[field.name] ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        placeholder={`Enter ${field.label}...`}
        className={cn(
          "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
          field.type === "number" ? "font-mono" : "",
        )}
      />
    </section>
  );
}
