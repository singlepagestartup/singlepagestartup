import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Inbox,
  LockKeyhole,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Workflow,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  iconButtonClass,
  primaryClass,
  secondaryClass,
} from "../../../shared/workflow-ui";
import {
  newStage,
  timestampLabel,
  toDraft,
  workflowEventLabels,
  type RequestMove,
  type WorkflowDraft,
  type WorkflowRelease,
  type WorkflowTask,
} from "../../../shared/workflows";
import { Component as TaskDetail } from "../task-detail";
import { Component as TaskKanban } from "../task-kanban";
import { Component as TaskTable } from "../task-table";
import { Component as WorkflowEditor } from "../workflow-editor";
import type { IComponentProps, WorkspaceScenario } from "./interface";
import { TaskFilters, type Filters } from "./TaskFilters";
import {
  dialogOverlay,
  TaskMoveDialog,
  type MoveInput,
} from "./TaskMoveDialog";

const workspaceFrame = "mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8";
const filterKeys = [
  "shop",
  "workflow",
  "version",
  "assignee",
  "state",
  "search",
] as const;

function readLocation(scenario: WorkspaceScenario): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    shop: params.get("shop") ?? "",
    workflow: params.get("workflow") ?? "",
    version: params.get("version") ?? "",
    assignee: params.get("assignee") ?? "",
    state: params.get("state") ?? (scenario === "waiting" ? "waiting" : ""),
    search: params.get("search") ?? "",
    view: params.get("view") === "table" ? "table" : "board",
  };
}

function setLocation(change: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(change)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, "", url);
}

interface Notice {
  kind: "success" | "conflict";
  message: string;
}

function taskLink(id: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-task-link]"),
  ).find((element) => element.dataset.taskLink === id);
}

export function Component({
  fixture,
  scenario = "default",
  canReadCosts = false,
}: IComponentProps) {
  const [filters, setFilters] = useState(() => readLocation(scenario));
  const [releases, setReleases] = useState(fixture.releases);
  const [tasks, setTasks] = useState(fixture.tasks);
  const [hasError, setHasError] = useState(scenario === "error");
  const [editor, setEditor] = useState<WorkflowDraft>();
  const [drafts, setDrafts] = useState<Record<string, WorkflowDraft>>({});
  const [taskId, setTaskId] = useState(
    () => new URLSearchParams(window.location.search).get("task") ?? "",
  );
  const [move, setMove] = useState<RequestMove>();
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<Notice>();

  const detailTrigger = useRef<HTMLElement | null>(null);
  const moveTrigger = useRef<HTMLElement | null>(null);
  const conflictTriggered = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => timers.current.forEach((timer) => clearTimeout(timer)),
    [],
  );

  const shopId =
    fixture.shops.find((shop) => shop.id === filters.shop)?.id ??
    fixture.shops[0]?.id;
  const shopReleases = releases.filter((release) => release.shopId === shopId);
  const workflowId =
    shopReleases.find((release) => release.id === filters.workflow)?.id ??
    shopReleases[0]?.id;
  const versions = shopReleases.filter((release) => release.id === workflowId);
  const latest = versions[0];
  const current =
    versions.find(
      (release) => release.version.toString() === filters.version,
    ) ?? latest;
  const moveTask = tasks.find((task) => task.id === move?.taskId);
  const detailTask = tasks.find((task) => task.id === taskId);
  const moveRelease = releases.find(
    (release) =>
      release.shopId === moveTask?.shopId &&
      release.id === moveTask.workflowId &&
      release.version === moveTask.version,
  );
  const detailRelease = releases.find(
    (release) =>
      release.shopId === detailTask?.shopId &&
      release.id === detailTask.workflowId &&
      release.version === detailTask.version,
  );
  const editorRelease = releases.find(
    (release) => release.id === editor?.id && release.shopId === editor.shopId,
  );
  const unpublished = Object.values(drafts).filter(
    (draft) =>
      draft.shopId === shopId &&
      !shopReleases.some((release) => release.id === draft.id),
  );
  const search = filters.search.trim().toLocaleLowerCase("ru");
  const visible =
    scenario === "empty"
      ? []
      : tasks.filter(
          (task) =>
            task.shopId === shopId &&
            task.workflowId === current?.id &&
            task.version === current.version &&
            (!filters.assignee || task.assignee === filters.assignee) &&
            (!filters.state || task.state === filters.state) &&
            (!search ||
              [task.id, task.label, task.customer, task.order?.id].some(
                (item) => item?.toLocaleLowerCase("ru").includes(search),
              )),
        );

  const onChangeFilters = useCallback((change: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...change }));
    setLocation(change);
  }, []);

  const onOpenTask = useCallback((id: string, anchor: HTMLAnchorElement) => {
    detailTrigger.current = anchor;
    setLocation({ task: id });
    setTaskId(id);
  }, []);

  const onRequestMove = useCallback(
    (request: RequestMove, element?: HTMLElement) => {
      moveTrigger.current = element ?? taskLink(request.taskId) ?? null;
      setMove(request);
    },
    [],
  );

  function closeDetail() {
    setTaskId("");
    setLocation({ task: "" });
  }

  function newWorkflow() {
    if (!shopId) return;
    const id = `workflow-${Date.now().toString(36)}`;
    setEditor({
      id,
      shopId,
      title: "",
      applicability: "",
      goal: "",
      stages: [newStage(`${id}-intake`)],
    });
  }

  function saveDraft(draft: WorkflowDraft) {
    setDrafts((current) => ({ ...current, [draft.id]: draft }));
  }

  function publishDraft(draft: WorkflowDraft) {
    setReleases((previous) => [
      {
        ...draft,
        version: (editorRelease?.version ?? 0) + 1,
        publishedAt: new Date().toISOString(),
      },
      ...previous,
    ]);
    saveDraft(draft);
    onChangeFilters({ shop: draft.shopId, workflow: draft.id, version: "" });
  }

  function completeMove(input: MoveInput) {
    if (!moveTask || !moveRelease) return;
    const destination = moveRelease.stages.find(
      (stage) => stage.id === input.stageId && !stage.archived,
    );
    if (!destination || moveTask.stageId === destination.id) return;
    const now = new Date().toISOString();
    setMove(undefined);
    setNotice(undefined);
    setPendingIds((previous) => new Set(previous).add(input.taskId));
    timers.current.push(
      setTimeout(() => {
        const conflict = scenario === "conflict" && !conflictTriggered.current;
        const conflictingStage =
          moveRelease.stages.find(
            (stage) =>
              stage.id !== moveTask.stageId &&
              stage.id !== destination.id &&
              !stage.archived,
          ) ?? destination;
        const stage = conflict ? conflictingStage : destination;
        if (conflict) conflictTriggered.current = true;
        const waits = stage.waitFor !== "none";
        setTasks((previous) =>
          previous.map((task): WorkflowTask =>
            task.id === input.taskId && task.revision === input.expectedRevision
              ? {
                  ...task,
                  stageId: stage.id,
                  revision: task.revision + 1,
                  assignee: stage.assignee || task.assignee,
                  updatedAt: now,
                  dueAt: waits
                    ? new Date(
                        Date.now() + stage.waitHours * 60 * 60 * 1000,
                      ).toISOString()
                    : undefined,
                  state: waits ? "waiting" : "active",
                  waitingFor: waits
                    ? workflowEventLabels[stage.waitFor]
                    : undefined,
                  history: [
                    ...task.history,
                    {
                      id: `${task.id}-r${task.revision + 1}`,
                      at: now,
                      stageId: stage.id,
                      actor: conflict ? "Игорь Орлов" : "Мария Волкова",
                      reason: conflict
                        ? "Изменение из другого сеанса."
                        : input.reason,
                      evidence: conflict ? undefined : input.evidence,
                    },
                  ],
                  assignments:
                    stage.assignee && stage.assignee !== task.assignee
                      ? [
                          ...task.assignments,
                          {
                            id: `${task.id}-assignment-r${task.revision + 1}`,
                            at: now,
                            assignee: stage.assignee,
                            reason: `Назначен на этапе «${stage.title}».`,
                          },
                        ]
                      : task.assignments,
                }
              : task,
          ),
        );
        setPendingIds((previous) => {
          const next = new Set(previous);
          next.delete(input.taskId);
          return next;
        });
        if (conflict) {
          setNotice({
            kind: "conflict",
            message: `${input.taskId} уже изменена в другом сеансе. Текущий этап «${stage.title}». Проверьте задачу перед новым переходом.`,
          });
          return;
        }
        setNotice({
          kind: "success",
          message: `${input.taskId} перемещена на этап «${stage.title}».`,
        });
      }, 800),
    );
  }

  function restoreFocus(element: HTMLElement | null, id?: string) {
    window.requestAnimationFrame(() => {
      if (element?.isConnected && !element.matches(":disabled"))
        element.focus();
      else if (id)
        (
          taskLink(id) ?? document.getElementById("crm-workspace-title")
        )?.focus();
      else document.getElementById("crm-workspace-title")?.focus();
    });
  }

  const forbidden = scenario === "forbidden";
  const showUnavailableTask = Boolean(
    taskId && (!detailTask || !detailRelease) && !forbidden && !hasError,
  );

  return (
    <main
      className="min-h-screen min-w-0 bg-muted/65 text-foreground"
      lang="ru"
      data-ds-block="crm.widget.workflow-workspace"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="widget"
      data-variant="workflow-workspace"
    >
      <div className="border-b border-border bg-card">
        <div
          className={`${workspaceFrame} flex min-h-14 items-center justify-between gap-3 py-2`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Workflow aria-hidden="true" className="size-4" />
            </div>
            <span className="font-primary text-sm font-semibold">CRM</span>
            {!forbidden && (
              <span className="min-w-0 truncate border-s border-border ps-2.5 text-sm text-muted-foreground">
                {fixture.shops.find((shop) => shop.id === shopId)?.title}
              </span>
            )}
          </div>
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
      </div>
      <div
        className={`${workspaceFrame} grid min-w-0 gap-4 py-5 sm:gap-5 sm:py-7`}
      >
        {forbidden ? (
          <section className="mx-auto grid w-full max-w-xl justify-items-center gap-3 rounded-xl border border-border bg-card p-7 text-center">
            <div className="grid size-10 place-items-center rounded-lg bg-muted">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </div>
            <h1
              id="crm-workspace-title"
              tabIndex={-1}
              className="font-primary text-xl font-semibold"
            >
              Нет доступа к задачам магазина
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Владелец магазина может дать вам право вести задачи.
            </p>
          </section>
        ) : editor ? (
          <WorkflowEditor
            key={editor.id}
            initialDraft={editor}
            currentRelease={editorRelease}
            people={fixture.people}
            payers={fixture.payers}
            onSave={saveDraft}
            onPublish={publishDraft}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div className="grid gap-1.5">
                <h1
                  id="crm-workspace-title"
                  tabIndex={-1}
                  className="font-primary text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
                >
                  Задачи магазина
                </h1>
                {current && !hasError && (
                  <p className="text-sm text-muted-foreground">
                    {current.title} · Версия {current.version}
                  </p>
                )}
              </div>
              {!hasError && (
                <div className="flex flex-wrap gap-2">
                  {latest && (
                    <button
                      className={secondaryClass}
                      type="button"
                      onClick={() =>
                        setEditor(drafts[latest.id] ?? toDraft(latest))
                      }
                    >
                      <SlidersHorizontal
                        aria-hidden="true"
                        className="size-4"
                      />{" "}
                      Редактор воронки
                    </button>
                  )}
                  <button
                    className={primaryClass}
                    type="button"
                    onClick={newWorkflow}
                  >
                    <Plus aria-hidden="true" className="size-4" /> Новая воронка
                  </button>
                </div>
              )}
            </header>
            {!hasError && unpublished.length > 0 && (
              <section
                className="flex flex-wrap items-center gap-2"
                aria-label="Сохранённые черновики"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  Черновики
                </span>
                {unpublished.map((draft) => (
                  <button
                    key={draft.id}
                    className={secondaryClass}
                    type="button"
                    onClick={() => setEditor(draft)}
                  >
                    {draft.title || "Воронка без названия"}
                  </button>
                ))}
              </section>
            )}
            {hasError ? (
              <section
                role="alert"
                className="grid w-full justify-items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-950"
              >
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <CircleAlert aria-hidden="true" className="size-5" /> Задачи
                  не загрузились
                </h2>
                <p className="text-sm leading-6">
                  Повторите запрос, чтобы вернуться к выбранной воронке.
                </p>
                <button
                  className={secondaryClass}
                  type="button"
                  onClick={() => setHasError(false)}
                >
                  <RotateCw aria-hidden="true" className="size-4" /> Повторить
                </button>
              </section>
            ) : current ? (
              <>
                <TaskFilters
                  filters={filters}
                  fixture={fixture}
                  releases={releases}
                  current={current}
                  onChange={onChangeFilters}
                />
                {notice && (
                  <div
                    role={notice.kind === "conflict" ? "alert" : "status"}
                    className={`flex items-start justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm leading-6 ${notice.kind === "conflict" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}
                  >
                    <p className="flex items-start gap-2 pt-0.5">
                      {notice.kind === "conflict" ? (
                        <CircleAlert
                          aria-hidden="true"
                          className="mt-1 size-4 shrink-0"
                        />
                      ) : (
                        <CircleCheck
                          aria-hidden="true"
                          className="mt-1 size-4 shrink-0"
                        />
                      )}
                      {notice.message}
                    </p>
                    <button
                      type="button"
                      aria-label="Закрыть сообщение"
                      className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2"
                      onClick={() => setNotice(undefined)}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                )}
                <section
                  aria-label="Задачи выбранной воронки"
                  className="grid min-w-0 gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <p aria-live="polite">
                      Задач ·{" "}
                      <span className="font-semibold text-foreground">
                        {visible.length}
                      </span>
                    </p>
                    <p className="text-xs">
                      Версия {current.version} опубликована{" "}
                      {timestampLabel(current.publishedAt)}
                    </p>
                  </div>
                  {!visible.length && (
                    <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-border bg-card p-5 text-center">
                      <Inbox
                        aria-hidden="true"
                        className="size-5 text-muted-foreground"
                      />
                      <h2 className="text-sm font-semibold">
                        Нет задач по выбранным фильтрам
                      </h2>
                      {filterKeys.slice(3).some((key) => filters[key]) && (
                        <button
                          className={secondaryClass}
                          type="button"
                          onClick={() =>
                            onChangeFilters({
                              assignee: "",
                              state: "",
                              search: "",
                            })
                          }
                        >
                          Сбросить поиск и фильтры задач
                        </button>
                      )}
                    </div>
                  )}
                  {filters.view === "board" ? (
                    <TaskKanban
                      stages={current.stages}
                      tasks={visible}
                      people={fixture.people}
                      pendingIds={pendingIds}
                      onOpenTask={onOpenTask}
                      onRequestMove={onRequestMove}
                    />
                  ) : (
                    <TaskTable
                      stages={current.stages}
                      tasks={visible}
                      people={fixture.people}
                      pendingIds={pendingIds}
                      onOpenTask={onOpenTask}
                      onRequestMove={onRequestMove}
                    />
                  )}
                </section>
              </>
            ) : (
              <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                У магазина пока нет опубликованных воронок.
              </p>
            )}
          </>
        )}
      </div>
      {!forbidden &&
        !hasError &&
        ((detailTask && detailRelease) || showUnavailableTask) && (
          <Dialog.Root
            open
            onOpenChange={(open) => {
              if (!open) closeDetail();
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className={dialogOverlay} />
              <Dialog.Content
                data-sps-theme="singlepage"
                aria-describedby={undefined}
                className="fixed inset-y-0 right-0 z-50 flex w-full min-w-0 max-w-[40rem] flex-col overflow-hidden border-l border-border bg-background font-default text-foreground shadow-xl"
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  restoreFocus(detailTrigger.current, taskId);
                }}
              >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-6">
                  <Dialog.Title className="text-sm font-semibold">
                    {detailTask ? "Задача" : "Задача недоступна"}
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Закрыть карточку задачи"
                    className={iconButtonClass}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                  {detailTask && detailRelease ? (
                    <TaskDetail
                      task={detailTask}
                      release={detailRelease}
                      people={fixture.people}
                      canReadCosts={canReadCosts}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Проверьте ссылку на задачу или выберите её в рабочем
                      месте.
                    </p>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      {move && moveTask && moveRelease && !forbidden && !hasError && (
        <TaskMoveDialog
          key={moveTask.id}
          task={moveTask}
          release={moveRelease}
          initialStageId={move.toStageId}
          onClose={() => setMove(undefined)}
          onRestoreFocus={() => restoreFocus(moveTrigger.current, moveTask.id)}
          onSubmit={completeMove}
        />
      )}
    </main>
  );
}
