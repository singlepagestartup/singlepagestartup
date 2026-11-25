"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceTask,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { storeEmployeeHref } from "../subject/me/ecommerce-module/store/paths";
import { StoreHeader } from "../subject/me/ecommerce-module/store/StoreHeader";
import { Kanban } from "./Kanban";
import { MoveDialog } from "./MoveDialog";
import { TaskTable } from "./TaskTable";
import { TaskFilters, type IFilters } from "./TaskFilters";
import { primaryClass, secondaryClass, storeList } from "./primitives";
import {
  boardStages,
  funnelEditHref,
  getStageName,
  hasStatus,
  taskHref,
  taskView,
  type RequestMove,
  type WorkflowPerson,
} from "./view-model";

interface IWorkspaceProps {
  widgetId: string;
  subjectId: string;
  storeSlug: string;
  language: string;
}

const initialFilters: IFilters = {
  funnel: "",
  assignee: "",
  status: "",
  search: "",
  view: "kanban",
};

function readFilters(params: URLSearchParams): IFilters {
  return {
    funnel: params.get("funnel") ?? "",
    assignee: params.get("assignee") ?? "",
    status: params.get("status") ?? "",
    search: params.get("search") ?? "",
    view: params.get("view") === "table" ? "table" : "kanban",
  };
}

function isDenied(error: unknown) {
  return hasStatus(error, 401, 403);
}

function restoreFocus(element?: HTMLElement | null) {
  requestAnimationFrame(() => {
    (element?.isConnected && !element.matches(":disabled")
      ? element
      : document.getElementById("store-crm-title")
    )?.focus();
  });
}

interface IMove extends RequestMove {
  task: ICrmWorkspaceTask;
}

type TMove = Extract<
  TCrmWorkspaceCommand,
  { kind: "transition" }
>["transition"];

export function Workspace({
  widgetId,
  subjectId,
  storeSlug,
  language,
}: IWorkspaceProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [initialized, setInitialized] = useState(false);
  const [querySearch, setQuerySearch] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [move, setMove] = useState<IMove>();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [conflictId, setConflictId] = useState<string>();
  const moveOpener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const location = readFilters(params);
    if (params.has("version")) {
      params.delete("version");
      window.history.replaceState(window.history.state, "", url);
    }
    setFilters(location);
    setQuerySearch(location.search);
    setInitialized(true);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setQuerySearch(filters.search), 220);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const stores = api.crmWorkspace.useStores(subjectId, storeSlug);
  const selectedStore = stores.data?.find((store) => store.slug === storeSlug);
  const storeId = selectedStore?.id ?? "";
  const options = api.crmWorkspace.useOptions(subjectId, storeId);
  const funnels = api.crmWorkspace.useFunnels({
    id: subjectId,
    params: { storeId, limit: 100 },
  });
  const selectedFunnel =
    funnels.data?.items.find((funnel) => funnel.id === filters.funnel) ??
    funnels.data?.items[0];
  useEffect(() => {
    if (!selectedStore || [stores.error, funnels.error].some(isDenied)) return;
    const params = new URLSearchParams(window.location.search);
    const funnelId = params.get("funnel");
    if (params.get("edit") !== "1" || !funnelId) return;
    const funnel = funnels.data?.items.find(({ id }) => id === funnelId);
    if (!funnel) return;
    router.replace(funnelEditHref(language, selectedStore.slug, funnel.slug));
  }, [
    funnels.data,
    funnels.error,
    language,
    router,
    selectedStore,
    stores.error,
  ]);
  const assigneeFilter = options.data?.participants.some(
    ({ id }) => id === filters.assignee,
  )
    ? filters.assignee
    : undefined;
  const normalizedStatus = ["active", "waiting", "closed"].includes(
    filters.status,
  )
    ? (filters.status as ICrmWorkspaceTaskQuery["status"])
    : undefined;
  const tasks = api.crmWorkspace.useTasks(
    {
      id: subjectId,
      params: {
        storeId,
        funnelId: selectedFunnel?.id,
        assigneeId: assigneeFilter,
        status: normalizedStatus,
        search: querySearch.trim() || undefined,
        cursor: cursors.at(-1),
        limit: 30,
      },
    },
    initialized && Boolean(selectedFunnel),
  );
  const conflict = api.crmWorkspace.useDetail({
    id: subjectId,
    params: { storeId, taskId: conflictId ?? "", limit: 1 },
  });
  const mutation = api.crmWorkspace.useCommand(subjectId);
  const records = useMemo(() => {
    if (!selectedFunnel || !selectedStore || isDenied(tasks.error)) return [];
    return (tasks.data?.items ?? []).map((task) =>
      taskView(
        task,
        selectedFunnel.definition.stages,
        taskHref(language, selectedStore.slug, task.id),
      ),
    );
  }, [language, selectedFunnel, selectedStore, tasks.data, tasks.error]);
  const stages = useMemo(
    () => boardStages(selectedFunnel?.definition.stages ?? [], records),
    [selectedFunnel, records],
  );
  const people = useMemo(() => {
    const result = new Map<string, WorkflowPerson>();
    if (!selectedStore) return [];
    for (const task of tasks.data?.items ?? []) {
      if (task.assigneeId && task.assigneeName) {
        result.set(task.assigneeId, {
          id: task.assigneeId,
          href: storeEmployeeHref(
            language,
            selectedStore.slug,
            task.assigneeId,
          ),
          name: task.assigneeName,
          language,
          profile: task.assigneeProfile,
          initials: task.assigneeName.slice(0, 2).toUpperCase(),
          kind: task.assigneeKind === "ai" ? "agent" : "human",
        });
      }
    }
    return [...result.values()];
  }, [language, selectedStore, tasks.data]);

  function changeFilters(change: Partial<IFilters>) {
    const next = { ...filters, ...change };
    const url = new URL(window.location.href);
    url.searchParams.delete("version");
    for (const [key, value] of Object.entries(next)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, "", url);
    setFilters(next);
    if (Object.keys(change).some((key) => key !== "view")) setCursors([]);
  }

  const requestMove = useCallback(
    (input: RequestMove, element?: HTMLElement) => {
      const task = tasks.data?.items.find((item) => item.id === input.taskId);
      if (!task || task.funnelId !== selectedFunnel?.id) return;
      moveOpener.current =
        element ??
        document.querySelector<HTMLElement>(
          `[data-task-link="${CSS.escape(input.taskId)}"]`,
        );
      setMove({ ...input, task });
    },
    [selectedFunnel?.id, tasks.data],
  );

  async function completeMove(input: TMove) {
    setMove(undefined);
    setPending((current) => new Set(current).add(input.taskId));
    setMessage("");
    setFailure("");
    setConflictId(undefined);
    try {
      await mutation.mutateAsync({ kind: "transition", transition: input });
      setMessage("Этап задачи обновлён.");
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        await tasks.refetch();
        setConflictId(input.taskId);
      } else {
        setFailure(
          error instanceof Error ? error.message : "Этап задачи не изменился.",
        );
      }
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(input.taskId);
        return next;
      });
    }
  }

  const denied =
    (stores.isSuccess && !selectedStore) ||
    [stores.error, funnels.error, options.error, tasks.error].some(isDenied);
  const readFailure =
    stores.error ?? funnels.error ?? options.error ?? tasks.error;
  const conflictStage =
    conflict.data &&
    getStageName(
      conflict.data.funnel.definition.stages,
      conflict.data.task.stageId,
    );
  return (
    <div
      lang="ru"
      id="store-workspace"
      className="min-w-0 scroll-mt-4 text-foreground"
    >
      {denied ? (
        <h1 className="rounded-xl border border-border bg-card p-5 text-xl font-semibold">
          Нет доступа к задачам магазина
        </h1>
      ) : readFailure && !selectedStore ? (
        <div
          role="alert"
          className="grid gap-3 rounded-xl border border-destructive/30 p-4"
        >
          <p>Задачи не загрузились.</p>
          <button
            type="button"
            className={`${secondaryClass} w-fit`}
            onClick={() => void stores.refetch()}
          >
            Повторить
          </button>
        </div>
      ) : !selectedStore ? (
        <p role="status" className="text-sm text-muted-foreground">
          Загружаем магазин…
        </p>
      ) : (
        <div className="grid min-w-0 gap-4">
          <StoreHeader
            language={language}
            storeSlug={selectedStore.slug}
            widgetId={widgetId}
            storeId={selectedStore.id}
            section="tasks"
            access={selectedStore}
          />
          <section
            className={storeList.panel}
            aria-labelledby="store-crm-title"
          >
            <header className={storeList.heading}>
              <div>
                <h1
                  id="store-crm-title"
                  tabIndex={-1}
                  className={storeList.title}
                >
                  Задачи магазина
                </h1>
                {selectedFunnel && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedFunnel.name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={taskHref(language, selectedStore.slug, "new")}
                  className={primaryClass}
                >
                  <Plus aria-hidden="true" className="size-4" /> Новая задача
                </Link>
              </div>
            </header>
            <TaskFilters
              filters={filters}
              funnels={funnels.data?.items ?? []}
              selectedFunnelId={selectedFunnel?.id}
              funnelsPending={funnels.isPending}
              participants={options.data?.participants ?? []}
              assigneeFilter={assigneeFilter}
              statusFilter={normalizedStatus}
              onChange={changeFilters}
            />
            {conflictId && (
              <p
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
              >
                Задача уже изменилась в другом сеансе.
                {conflictStage && ` Текущий этап «${conflictStage}».`}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"
              >
                {message}
              </p>
            )}
            {(failure || readFailure) && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
              >
                {failure || "Задачи временно недоступны. Повторите загрузку."}
              </p>
            )}
            {selectedFunnel && tasks.isPending ? (
              <p role="status" className="text-sm text-muted-foreground">
                Загружаем задачи…
              </p>
            ) : selectedFunnel ? (
              <section
                aria-label="Задачи выбранной воронки"
                className="grid min-w-0 gap-3"
              >
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Задач на странице · {records.length}
                </p>
                {filters.view === "table" ? (
                  <TaskTable
                    stages={stages}
                    tasks={records}
                    people={people}
                    pendingIds={pending}
                    canAssign={Boolean(options.data?.participants.length)}
                    onRequestMove={requestMove}
                  />
                ) : (
                  <Kanban
                    stages={stages}
                    tasks={records}
                    people={people}
                    pendingIds={pending}
                    canAssign={Boolean(options.data?.participants.length)}
                    onRequestMove={requestMove}
                  />
                )}
                {(cursors.length > 0 || tasks.data?.nextCursor) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={!cursors.length}
                      onClick={() => setCursors((old) => old.slice(0, -1))}
                    >
                      Предыдущая страница
                    </button>
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={!tasks.data?.nextCursor}
                      onClick={() => {
                        const cursor = tasks.data?.nextCursor;
                        if (cursor) setCursors((old) => [...old, cursor]);
                      }}
                    >
                      Следующая страница
                    </button>
                  </div>
                )}
              </section>
            ) : !funnels.isFetching && !readFailure ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Создайте воронку, чтобы открыть её этапы.
              </p>
            ) : null}
          </section>
        </div>
      )}
      {!denied && move && move.task.funnelId === selectedFunnel?.id && (
        <MoveDialog
          key={move.taskId}
          task={move.task}
          stages={selectedFunnel.definition.stages}
          destinationId={move.toStageId}
          onClose={() => setMove(undefined)}
          onRestoreFocus={() => restoreFocus(moveOpener.current)}
          onSubmit={(input) => void completeMove(input)}
        />
      )}
    </div>
  );
}
