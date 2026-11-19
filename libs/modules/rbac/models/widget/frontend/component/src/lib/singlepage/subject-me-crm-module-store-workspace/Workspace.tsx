"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Kanban as KanbanIcon,
  List,
  Plus,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspacePublication,
  ICrmWorkspaceTask,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Editor } from "./Editor";
import { Field } from "./Editor/Fields";
import { Kanban } from "./Kanban";
import { MoveDialog } from "./MoveDialog";
import { TaskDrawer } from "./TaskDrawer";
import { TaskTable } from "./TaskTable";
import { fieldClass, primaryClass, secondaryClass } from "./primitives";
import {
  taskHref,
  taskView,
  workspaceHref,
  type RequestMove,
  type WorkflowPerson,
} from "./view-model";

interface IWorkspaceProps {
  subjectId: string;
  storeSlug?: string;
  initialTaskId?: string;
  language: string;
}

interface IFilters {
  funnel: string;
  version: string;
  assignee: string;
  status: string;
  search: string;
  view: "kanban" | "table";
}

const initialFilters: IFilters = {
  funnel: "",
  version: "",
  assignee: "",
  status: "",
  search: "",
  view: "kanban",
};

function readFilters(): IFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    funnel: params.get("funnel") ?? "",
    version: params.get("version") ?? "",
    assignee: params.get("assignee") ?? "",
    status: params.get("status") ?? "",
    search: params.get("search") ?? "",
    view: params.get("view") === "table" ? "table" : "kanban",
  };
}

function isDenied(error: unknown) {
  const status = (error as { status?: number } | undefined)?.status;
  return status === 401 || status === 403;
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
  publication: ICrmWorkspacePublication;
}

type TMove = Extract<
  TCrmWorkspaceCommand,
  { kind: "transition" }
>["transition"];

export function Workspace({
  subjectId,
  storeSlug,
  initialTaskId,
  language,
}: IWorkspaceProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [initialized, setInitialized] = useState(false);
  const [querySearch, setQuerySearch] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [editor, setEditor] = useState<ICrmWorkspaceFunnel | "new">();
  const [openedTaskId, setOpenedTaskId] = useState(initialTaskId);
  const [historyCursor, setHistoryCursor] = useState<string>();
  const [move, setMove] = useState<IMove>();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [conflictId, setConflictId] = useState<string>();
  const taskOpener = useRef<HTMLElement | null>(null);
  const moveOpener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const location = readFilters();
    setFilters(location);
    setQuerySearch(location.search);
    setInitialized(true);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setQuerySearch(filters.search), 220);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const stores = api.crmWorkspace.useStores(subjectId);
  const selectedStore = storeSlug
    ? stores.data?.find((store) => store.slug === storeSlug)
    : stores.data?.[0];
  const storeId = selectedStore?.id ?? "";
  const options = api.crmWorkspace.useOptions(subjectId, storeId);
  const funnels = api.crmWorkspace.useFunnels({
    id: subjectId,
    params: { storeId, limit: 100 },
  });
  const selectedFunnel =
    funnels.data?.items.find((funnel) => funnel.id === filters.funnel) ??
    funnels.data?.items.find((funnel) => funnel.publishedVersion !== null) ??
    funnels.data?.items[0];
  const publications = api.crmWorkspace.usePublications({
    id: subjectId,
    params: { storeId, funnelId: selectedFunnel?.id ?? "", limit: 100 },
  });
  const selectedPublication =
    publications.data?.items.find(
      (version) => version.id === filters.version,
    ) ?? publications.data?.items[0];
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
        publicationId: selectedPublication?.id,
        assigneeId: options.data?.participants.some(
          (person) => person.id === filters.assignee,
        )
          ? filters.assignee
          : undefined,
        status: normalizedStatus,
        search: querySearch.trim() || undefined,
        cursor: cursors.at(-1),
        limit: 30,
      },
    },
    initialized && Boolean(selectedPublication),
  );
  const detail = api.crmWorkspace.useDetail({
    id: subjectId,
    params: {
      storeId,
      taskId: openedTaskId ?? "",
      cursor: historyCursor,
      limit: 40,
    },
  });
  const conflict = api.crmWorkspace.useDetail({
    id: subjectId,
    params: { storeId, taskId: conflictId ?? "", limit: 1 },
  });
  const mutation = api.crmWorkspace.useCommand(subjectId);
  const stages = useMemo(() => {
    return (
      selectedPublication?.definition.stages.map((stage) => ({
        id: stage.id,
        title: stage.name,
        archived:
          stage.archived ||
          selectedFunnel?.definition.stages.find((item) => item.id === stage.id)
            ?.archived,
      })) ?? []
    );
  }, [selectedPublication, selectedFunnel]);
  const records = useMemo(() => {
    if (!selectedPublication || !selectedStore || isDenied(tasks.error))
      return [];
    return (tasks.data?.items ?? []).map((task) =>
      taskView(
        task,
        selectedPublication.definition.stages,
        taskHref(language, selectedStore.slug, task.id),
      ),
    );
  }, [language, selectedPublication, selectedStore, tasks.data, tasks.error]);
  const people = useMemo(() => {
    const result = new Map<string, WorkflowPerson>();
    for (const task of tasks.data?.items ?? []) {
      if (task.assigneeId && task.assigneeName) {
        result.set(task.assigneeId, {
          id: task.assigneeId,
          name: task.assigneeName,
          initials: task.assigneeName.slice(0, 2).toUpperCase(),
          kind: task.assigneeKind === "ai" ? "agent" : "human",
        });
      }
    }
    return [...result.values()];
  }, [tasks.data]);

  function changeFilters(change: Partial<IFilters>) {
    const next = { ...filters, ...change };
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, "", url);
    setFilters(next);
    if (Object.keys(change).some((key) => key !== "view")) setCursors([]);
  }

  const openTask = useCallback((taskId: string, element: HTMLElement) => {
    taskOpener.current = element;
    setHistoryCursor(undefined);
    setOpenedTaskId(taskId);
  }, []);

  const requestMove = useCallback(
    (input: RequestMove, element?: HTMLElement) => {
      const task = tasks.data?.items.find((item) => item.id === input.taskId);
      if (!task || !selectedPublication) return;
      moveOpener.current =
        element ??
        document.querySelector<HTMLElement>(
          `[data-task-link="${CSS.escape(input.taskId)}"]`,
        );
      setMove({ ...input, task, publication: selectedPublication });
    },
    [selectedPublication, tasks.data],
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
    [
      stores.error,
      funnels.error,
      options.error,
      publications.error,
      tasks.error,
    ].some(isDenied);
  const readFailure =
    stores.error ??
    funnels.error ??
    options.error ??
    publications.error ??
    tasks.error;
  const conflictStage = conflict.data?.publication.definition.stages.find(
    (stage) => stage.id === conflict.data?.task.stageId,
  )?.name;

  return (
    <div lang="ru" className="min-w-0 text-foreground">
      <div className="mb-5 flex min-h-12 items-center justify-between gap-2 border-b border-border pb-3">
        <p className="flex min-w-0 items-center gap-2.5 text-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Workflow aria-hidden="true" className="size-4" />
          </span>
          <span className="font-semibold">CRM</span>
          {selectedStore && (
            <span className="truncate border-s border-border ps-2.5 text-muted-foreground">
              {selectedStore.title}
            </span>
          )}
        </p>
        {editor && (
          <button
            className={secondaryClass}
            type="button"
            onClick={() => setEditor(undefined)}
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> К задачам
          </button>
        )}
      </div>
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
          Загружаем магазины…
        </p>
      ) : editor && options.data ? (
        <Editor
          key={editor === "new" ? "new" : editor.id}
          storeId={storeId}
          initial={editor === "new" ? undefined : editor}
          options={options.data}
          execute={mutation.mutateAsync}
          onPublished={(funnel) => changeFilters({ funnel, version: "" })}
        />
      ) : (
        <div className="grid min-w-0 gap-4">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1
                id="store-crm-title"
                tabIndex={-1}
                className="text-3xl font-semibold tracking-tight"
              >
                Задачи магазина
              </h1>
              {selectedPublication && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPublication.name} · Версия{" "}
                  {selectedPublication.version}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFunnel && (
                <button
                  type="button"
                  className={secondaryClass}
                  disabled={!options.data}
                  onClick={() => setEditor(selectedFunnel)}
                >
                  <SlidersHorizontal aria-hidden="true" className="size-4" />{" "}
                  Редактор воронки
                </button>
              )}
              <button
                type="button"
                className={primaryClass}
                disabled={!options.data}
                onClick={() => setEditor("new")}
              >
                <Plus aria-hidden="true" className="size-4" /> Новая воронка
              </button>
            </div>
          </header>
          <div className="grid gap-3 rounded-xl border border-border bg-card p-3.5">
            <div className="flex flex-wrap justify-between gap-3">
              <label className="block w-full sm:max-w-md">
                <span className="sr-only">Поиск задач</span>
                <input
                  type="search"
                  className={fieldClass}
                  value={filters.search}
                  placeholder="Номер задачи, заказа или участника"
                  onChange={(event) =>
                    changeFilters({ search: event.currentTarget.value })
                  }
                />
              </label>
              <div
                className="flex items-center gap-1 rounded-lg bg-muted p-1"
                role="group"
                aria-label="Представление задач"
              >
                <button
                  type="button"
                  className={secondaryClass}
                  aria-pressed={filters.view === "kanban"}
                  onClick={() => changeFilters({ view: "kanban" })}
                >
                  <KanbanIcon aria-hidden="true" className="size-4" /> Канбан
                </button>
                <button
                  type="button"
                  className={secondaryClass}
                  aria-pressed={filters.view === "table"}
                  onClick={() => changeFilters({ view: "table" })}
                >
                  <List aria-hidden="true" className="size-4" /> Таблица
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              <Field label="Магазин">
                <select
                  className={fieldClass}
                  value={selectedStore.slug}
                  onChange={(event) =>
                    router.push(
                      workspaceHref(language, event.currentTarget.value),
                    )
                  }
                >
                  {stores.data?.map((store) => (
                    <option key={store.id} value={store.slug}>
                      {store.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Воронка">
                <select
                  className={fieldClass}
                  value={selectedFunnel?.id ?? ""}
                  onChange={(event) =>
                    changeFilters({
                      funnel: event.currentTarget.value,
                      version: "",
                    })
                  }
                >
                  {!selectedFunnel && <option value="">Нет воронок</option>}
                  {funnels.data?.items.map((funnel) => (
                    <option key={funnel.id} value={funnel.id}>
                      {funnel.name}
                      {funnel.publishedVersion === null ? " · Черновик" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Версия">
                <select
                  className={fieldClass}
                  value={selectedPublication?.id ?? ""}
                  onChange={(event) =>
                    changeFilters({ version: event.currentTarget.value })
                  }
                >
                  {!selectedPublication && (
                    <option value="">Нет публикаций</option>
                  )}
                  {publications.data?.items.map((version) => (
                    <option key={version.id} value={version.id}>
                      Версия {version.version}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Исполнитель">
                <select
                  className={fieldClass}
                  value={filters.assignee}
                  onChange={(event) =>
                    changeFilters({ assignee: event.currentTarget.value })
                  }
                >
                  <option value="">Все исполнители</option>
                  {options.data?.participants.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Состояние">
                <select
                  className={fieldClass}
                  value={filters.status}
                  onChange={(event) =>
                    changeFilters({ status: event.currentTarget.value })
                  }
                >
                  <option value="">Все состояния</option>
                  <option value="active">В работе</option>
                  <option value="waiting">Ожидание</option>
                  <option value="closed">Закрытые</option>
                </select>
              </Field>
            </div>
          </div>
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
          {selectedPublication && tasks.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              Загружаем задачи…
            </p>
          ) : selectedPublication ? (
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
                  onOpenTask={openTask}
                  onRequestMove={requestMove}
                />
              ) : (
                <Kanban
                  stages={stages}
                  tasks={records}
                  people={people}
                  pendingIds={pending}
                  onOpenTask={openTask}
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
          ) : !funnels.isFetching && !publications.isFetching ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Опубликуйте воронку, чтобы открыть её этапы.
            </p>
          ) : null}
        </div>
      )}
      {!denied && selectedStore && openedTaskId && (
        <TaskDrawer
          key={openedTaskId}
          taskId={openedTaskId}
          options={options.data}
          detail={isDenied(detail.error) ? undefined : detail.data}
          error={
            detail.error && (!detail.data || isDenied(detail.error))
              ? "Задача недоступна. Проверьте ссылку или разрешения."
              : undefined
          }
          href={taskHref(language, selectedStore.slug, openedTaskId)}
          onClose={() => {
            setOpenedTaskId(undefined);
            if (initialTaskId)
              router.replace(workspaceHref(language, selectedStore.slug));
          }}
          onRestoreFocus={() => restoreFocus(taskOpener.current)}
          onNextHistory={setHistoryCursor}
          onAssign={(assignment) =>
            mutation.mutateAsync({ kind: "assign", assignment })
          }
          onFulfill={(fulfillment) =>
            mutation.mutateAsync({ kind: "fulfill", fulfillment })
          }
        />
      )}
      {!denied && move && (
        <MoveDialog
          key={move.taskId}
          task={move.task}
          publication={move.publication}
          destinationId={move.toStageId}
          onClose={() => setMove(undefined)}
          onRestoreFocus={() => restoreFocus(moveOpener.current)}
          onSubmit={(input) => void completeMove(input)}
        />
      )}
    </div>
  );
}
