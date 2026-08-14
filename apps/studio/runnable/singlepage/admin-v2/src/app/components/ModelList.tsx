import React, { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Outlet } from "react-router";
import { api, Model, Record as DataRecord } from "../data";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { PreviewDialog } from "./PreviewDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

export function ModelList() {
  const { moduleSlug, modelSlug } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const module = moduleSlug
    ? api.getModules().find((m) => m.slug === moduleSlug)
    : undefined;
  const model =
    moduleSlug && modelSlug ? api.getModel(moduleSlug, modelSlug) : undefined;
  const records = modelSlug ? api.getRecords(modelSlug) : [];

  // Filter
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      Object.values(r).some((v) => {
        if (typeof v === "object" && v !== null) {
          return Object.values(v).some((sv) =>
            String(sv).toLowerCase().includes(q),
          );
        }
        return String(v).toLowerCase().includes(q);
      }),
    );
  }, [records, searchTerm]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        const aVal = a.adminTitle || a.title?.en || a.title || "";
        const bVal = b.adminTitle || b.title?.en || b.title || "";
        return String(aVal).localeCompare(String(bVal));
      }
      if (sortBy === "slug") {
        return String(a.slug || "").localeCompare(String(b.slug || ""));
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }, [filtered, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const items = sorted.slice(startIdx, startIdx + itemsPerPage);

  const handleDelete = useCallback(
    (id: string) => {
      if (!modelSlug) return;
      api.deleteRecord(modelSlug, id);
      setDeleteTarget(null);
      window.location.reload();
    },
    [modelSlug],
  );

  const getTitle = (record: DataRecord) => {
    return (
      record.adminTitle ||
      (typeof record.title === "object" ? record.title?.en : record.title) ||
      "Untitled"
    );
  };

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
  };

  if (!moduleSlug || !modelSlug)
    return <div className="p-8 text-center text-red-500">Invalid Route</div>;

  if (!model)
    return (
      <div className="p-8 text-center text-slate-400">
        Model not found:{" "}
        <span className="font-mono text-red-500">{modelSlug}</span>
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        {/* Breadcrumb + Title */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{module?.name ?? moduleSlug}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{modelSlug}</span>
          </div>
          <h1 className="text-3xl tracking-tight capitalize">{model.name}</h1>
        </div>

        {/* Toolbar */}
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[300px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 border-border bg-card focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
                  placeholder="Search entities..."
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px] border-border bg-card focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Sort: ID</SelectItem>
                  <SelectItem value="title">Sort: Title</SelectItem>
                  <SelectItem value="slug">Sort: Slug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/${moduleSlug}/${modelSlug}/new`)}
              className="inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add new
            </button>
          </div>
        </section>

        {/* Entity list */}
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white p-20 text-center text-sm text-muted-foreground">
            No found items.
          </div>
        ) : (
          <section className="space-y-3">
            {items.map((record) => {
              const title = getTitle(record);
              const slug = record.slug;
              const shortDesc =
                typeof record.shortDescription === "object"
                  ? record.shortDescription?.en
                  : record.shortDescription;
              const variant = record.variant;

              return (
                <article
                  key={record.id}
                  className="rounded-lg border border-slate-300 bg-white p-5 transition hover:border-slate-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <h3 className="truncate text-lg">{title}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {slug !== undefined && (
                          <div>
                            <span className="text-slate-500">Slug</span>
                            <p className="mt-0.5 break-all font-mono text-slate-900">
                              {slug}
                            </p>
                          </div>
                        )}
                        {shortDesc && (
                          <div className="col-span-2">
                            <span className="text-slate-500">
                              Short Description
                            </span>
                            <p className="mt-0.5 line-clamp-2 text-slate-900">
                              {shortDesc}
                            </p>
                          </div>
                        )}
                        {variant !== undefined && (
                          <div>
                            <span className="text-slate-500">Variant</span>
                            <p className="mt-0.5 text-slate-900">{variant}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">ID</span>
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => copyId(record.id, e)}
                              className="block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                              title={record.id}
                              aria-label="Copy id"
                            >
                              {record.id}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <PreviewDialog record={record} />
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/${moduleSlug}/${modelSlug}/${record.id}`,
                          )
                        }
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: record.id, title })
                        }
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-sm transition hover:bg-slate-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Pagination */}
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] border-border bg-card focus:border-slate-400 focus:ring-2 focus:ring-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 per page</SelectItem>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages} ({sorted.length} total)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className="max-w-md p-0 overflow-hidden gap-0 [&>button.absolute]:hidden"
          aria-describedby={undefined}
        >
          <div className="p-6 space-y-2">
            <DialogTitle className="text-xl">Delete entity?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This action cannot be undone. The entity will be permanently
              removed.
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
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="inline-flex items-center rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
            >
              Delete entity
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Outlet renders ModelEdit as a Sheet overlay */}
      <Outlet />
    </>
  );
}
