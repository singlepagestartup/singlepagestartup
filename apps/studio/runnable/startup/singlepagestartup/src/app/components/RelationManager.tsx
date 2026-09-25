import React, { useState, useEffect } from "react";
import { api, Relation, Record as DataRecord, Model } from "../data";
import {
  Trash2,
  Pencil,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./ui/command";

interface RelationManagerProps {
  sourceModelSlug: string;
  sourceRecordId: string;
  relation: Relation;
  level: number;
  onOpenEntity: (
    moduleSlug: string,
    modelSlug: string,
    recordId: string,
  ) => void;
}

const VARIANT_OPTIONS = [
  "default",
  "featured",
  "compact",
  "expanded",
  "hidden",
];

export function RelationManager({
  sourceModelSlug,
  sourceRecordId,
  relation,
  level,
  onOpenEntity,
}: RelationManagerProps) {
  const [relatedItems, setRelatedItems] = useState<
    { joinRecord: DataRecord; targetRecord?: DataRecord }[]
  >([]);
  const [joinModel, setJoinModel] = useState<Model | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(1);

  // Search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("all");

  // Relation drawer (edit/create)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingJoin, setEditingJoin] = useState<DataRecord | null>(null);
  const [drawerMeta, setDrawerMeta] = useState<Record<string, any>>({});
  const [selectedTargetId, setSelectedTargetId] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadRelated = () => {
    const items = api.getRelatedRecords(
      sourceModelSlug,
      sourceRecordId,
      relation,
    );
    setRelatedItems(items);
  };

  useEffect(() => {
    loadRelated();
    const modules = api.getModules();
    for (const mod of modules) {
      const m = mod.models.find(
        (model) => model.slug === relation.joinModelSlug,
      );
      if (m) {
        setJoinModel(m);
        break;
      }
    }
  }, [sourceModelSlug, sourceRecordId, relation]);

  // Metadata fields (join model fields, exclude FK and id)
  const metadataFields = joinModel
    ? joinModel.fields.filter((f) => {
        const ignored = [
          "id",
          `${sourceModelSlug}Id`,
          `${relation.targetModelSlug}Id`,
        ];
        return !ignored.includes(f.name) && !f.readonly;
      })
    : [];

  // Filter + search
  const filteredItems = relatedItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const { joinRecord, targetRecord } = item;

    const searchMap: Record<string, string> = {
      id: joinRecord.id,
      [`${sourceModelSlug}Id`]: sourceRecordId,
      [`${relation.targetModelSlug}Id`]: targetRecord?.id || "",
      variant: joinRecord.variant || "",
      className: joinRecord.className || "",
      orderIndex: String(joinRecord.orderIndex ?? ""),
    };

    if (filterField !== "all") {
      return String(searchMap[filterField] ?? "")
        .toLowerCase()
        .includes(q);
    }
    return Object.values(searchMap).some((v) => v.toLowerCase().includes(q));
  });

  // Pagination
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const displayedItems = filteredItems.slice(startIdx, startIdx + perPage);

  const handleMoveUp = (joinId: string) => {
    const idx = relatedItems.findIndex((i) => i.joinRecord.id === joinId);
    if (idx <= 0) return;
    const items = [...relatedItems];
    [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
    items.forEach((item, i) => {
      item.joinRecord.orderIndex = i;
      api.updateRecord(relation.joinModelSlug, item.joinRecord.id, {
        orderIndex: i,
      });
    });
    setRelatedItems(items);
  };

  const handleMoveDown = (joinId: string) => {
    const idx = relatedItems.findIndex((i) => i.joinRecord.id === joinId);
    if (idx < 0 || idx >= relatedItems.length - 1) return;
    const items = [...relatedItems];
    [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
    items.forEach((item, i) => {
      item.joinRecord.orderIndex = i;
      api.updateRecord(relation.joinModelSlug, item.joinRecord.id, {
        orderIndex: i,
      });
    });
    setRelatedItems(items);
  };

  const handleDetach = (joinId: string) => {
    api.deleteRelation(relation.joinModelSlug, joinId);
    setDeleteTarget(null);
    loadRelated();
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingJoin(null);
    setSelectedTargetId("");
    const initial: Record<string, any> = {};
    metadataFields.forEach((f) => {
      if (f.name === "orderIndex") initial[f.name] = relatedItems.length;
      else if (f.name === "variant") initial[f.name] = "default";
      else initial[f.name] = "";
    });
    setDrawerMeta(initial);
    setDrawerOpen(true);
  };

  const openEditDrawer = (joinRecord: DataRecord) => {
    setDrawerMode("edit");
    setEditingJoin(joinRecord);
    const meta: Record<string, any> = {};
    metadataFields.forEach((f) => {
      meta[f.name] = joinRecord[f.name] ?? "";
    });
    setDrawerMeta(meta);
    setDrawerOpen(true);
  };

  const handleSaveRelation = () => {
    if (drawerMode === "create") {
      if (!selectedTargetId) return;
      api.addRelation(
        relation,
        sourceModelSlug,
        sourceRecordId,
        selectedTargetId,
        drawerMeta,
      );
    } else if (editingJoin) {
      api.updateRecord(relation.joinModelSlug, editingJoin.id, drawerMeta);
    }
    setDrawerOpen(false);
    loadRelated();
  };

  const getLabel = (record?: DataRecord) => {
    if (!record) return "Unknown";
    if (record.adminTitle) return record.adminTitle;
    if (record.title) {
      if (typeof record.title === "object")
        return record.title.en || record.title.ru || "Untitled";
      return record.title;
    }
    if (record.name) return record.name;
    if (record.key) return record.key;
    return record.id;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Available targets for attach
  const availableTargets = api.getRecords(relation.targetModelSlug);

  const getRelationEntityLabel = (entity: DataRecord) => {
    const label = getLabel(entity);
    if (entity.key) return `${label} | ${entity.key}`;
    if (entity.slug) return `${label} | ${entity.slug}`;
    return label;
  };

  const filterOptions = [
    { value: "all", label: "All fields" },
    { value: "id", label: "ID" },
    { value: `${sourceModelSlug}Id`, label: `${sourceModelSlug} ID` },
    {
      value: `${relation.targetModelSlug}Id`,
      label: `${relation.targetModelSlug} ID`,
    },
    { value: "variant", label: "Variant" },
    { value: "className", label: "Class Name" },
    { value: "orderIndex", label: "Order Index" },
  ];

  return (
    <>
      {/* Relation section */}
      <section className="rounded-xl border border-slate-300 bg-slate-100 p-5">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="pl-9 border-border bg-card focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
              />
            </div>
            <Select
              value={filterField}
              onValueChange={(value) => {
                setFilterField(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] border-border bg-card focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Attach
          </button>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {displayedItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No matching relations.
            </div>
          ) : (
            displayedItems.map(({ joinRecord, targetRecord }, index) => {
              const absoluteIndex = startIdx + index;
              return (
                <article
                  key={joinRecord.id}
                  className="rounded-lg border border-slate-300 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Move up/down */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        type="button"
                        disabled={absoluteIndex === 0}
                        onClick={() => handleMoveUp(joinRecord.id)}
                        className="rounded p-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={absoluteIndex === total - 1}
                        onClick={() => handleMoveDown(joinRecord.id)}
                        className="rounded p-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Order Index</span>
                          <p className="mt-0.5 font-mono text-slate-900">
                            {joinRecord.orderIndex ?? 0}
                          </p>
                        </div>
                        {joinRecord.variant !== undefined && (
                          <div>
                            <span className="text-slate-500">Variant</span>
                            <p className="mt-0.5 text-slate-900">
                              {joinRecord.variant || "—"}
                            </p>
                          </div>
                        )}
                        {joinRecord.className !== undefined && (
                          <div>
                            <span className="text-slate-500">Class Name</span>
                            <p className="mt-0.5 text-slate-900">
                              {joinRecord.className || "—"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* IDs */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-slate-500">ID</span>
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                copyToClipboard(joinRecord.id);
                              }}
                              className={cn(
                                "inline-block max-w-full truncate rounded border px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition-colors",
                                copiedKey === joinRecord.id
                                  ? "border-green-500 bg-green-50"
                                  : "border-slate-300 bg-white hover:bg-slate-100",
                              )}
                              title={joinRecord.id}
                            >
                              {joinRecord.id}
                            </button>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-500">
                            {sourceModelSlug} ID
                          </span>
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                copyToClipboard(sourceRecordId);
                              }}
                              className={cn(
                                "inline-block max-w-full truncate rounded border px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition-colors",
                                copiedKey === sourceRecordId
                                  ? "border-green-500 bg-green-50"
                                  : "border-slate-300 bg-white hover:bg-slate-100",
                              )}
                              title={sourceRecordId}
                            >
                              {sourceRecordId}
                            </button>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-500">
                            {relation.targetModelSlug} ID
                          </span>
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                copyToClipboard(targetRecord?.id || "");
                              }}
                              className={cn(
                                "inline-block max-w-full truncate rounded border px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition-colors",
                                copiedKey === (targetRecord?.id || "")
                                  ? "border-green-500 bg-green-50"
                                  : "border-slate-300 bg-white hover:bg-slate-100",
                              )}
                              title={targetRecord?.id || ""}
                            >
                              {targetRecord?.id || "—"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openEditDrawer(joinRecord)}
                        className="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-slate-100"
                        aria-label="Edit relation"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (targetRecord?.id) {
                            onOpenEntity(
                              relation.targetModuleSlug,
                              relation.targetModelSlug,
                              targetRecord.id,
                            );
                          }
                        }}
                        className="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-slate-100"
                        aria-label="Open related entity"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(joinRecord.id)}
                        className="inline-flex items-center rounded-md border border-border p-2 transition hover:bg-slate-100"
                        aria-label="Delete relation"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-3 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Per page</label>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] border-border bg-card focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 5, 10, 25].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Page {safePage} of {totalPages} ({total} total)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Create/Edit Relation Sheet ─────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-xl p-0 gap-0 [&>button.absolute]:hidden sm:max-w-xl"
        >
          <SheetTitle className="sr-only">
            {drawerMode === "create" ? "Create Relation" : "Edit Relation"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Relation editor drawer
          </SheetDescription>
          <header className="border-b border-border px-6 pb-4 pt-6">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl tracking-tight">
                  {drawerMode === "create"
                    ? "Create Relation"
                    : "Edit Relation"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {drawerMode === "create"
                    ? `Link a new ${relation.targetModelSlug} to this entity`
                    : "Update the relation properties"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded p-2 transition hover:bg-muted"
                aria-label="Close relation editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {drawerMode === "create" && (
              <section className="space-y-2">
                <label className="block text-sm">
                  {relation.targetModelSlug}
                </label>
                <Command className="rounded-md border border-border bg-card">
                  <CommandInput
                    placeholder={`Search ${relation.targetModelSlug}...`}
                    className="h-9"
                  />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      {availableTargets.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={getRelationEntityLabel(t)}
                          onSelect={() => setSelectedTargetId(t.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedTargetId === t.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {getRelationEntityLabel(t)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </section>
            )}

            {metadataFields.map((field) => (
              <section key={field.name} className="space-y-2">
                <label className="block text-sm">{field.label}</label>
                {field.name === "variant" ? (
                  <Select
                    value={drawerMeta[field.name] ?? "default"}
                    onValueChange={(value) =>
                      setDrawerMeta((prev) => ({
                        ...prev,
                        [field.name]: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-card focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANT_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={drawerMeta[field.name] ?? ""}
                    onChange={(e) =>
                      setDrawerMeta((prev) => ({
                        ...prev,
                        [field.name]:
                          field.type === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value,
                      }))
                    }
                    placeholder={
                      field.name === "className" ? "Optional CSS class" : ""
                    }
                    className="border-border bg-card focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
                  />
                )}
              </section>
            ))}
          </div>

          <footer className="flex items-center justify-end border-t border-border p-6">
            <button
              type="button"
              onClick={handleSaveRelation}
              disabled={drawerMode === "create" && !selectedTargetId}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {drawerMode === "create" ? "Create Relation" : "Update Relation"}
            </button>
          </footer>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className="max-w-md p-0 overflow-hidden gap-0 [&>button.absolute]:hidden"
          aria-describedby={undefined}
        >
          <div className="p-6 space-y-2">
            <DialogTitle className="text-xl">Delete relation?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This relation link will be removed from the entity.
            </DialogDescription>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-300 p-6">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && handleDetach(deleteTarget)}
              className="inline-flex items-center rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
            >
              Delete relation
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
