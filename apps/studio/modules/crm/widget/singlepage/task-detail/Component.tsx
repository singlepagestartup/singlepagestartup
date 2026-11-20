import {
  Archive,
  ArrowUpRight,
  ClipboardList,
  FolderOpen,
  History,
  MessageSquare,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { Assignee, DueDate, TaskStatus } from "../../../shared/workflow-ui";
import { taskHref, timestampLabel } from "../../../shared/workflows";
import type { IComponentProps } from "./interface";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DetailSectionProps {
  Icon: LucideIcon;
  title: string;
  children: ReactNode;
}

function DetailSection({ Icon, title, children }: DetailSectionProps) {
  return (
    <section className="grid gap-3 border-t border-border pt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Component({
  task,
  release,
  people,
  audience = "manager",
  canReadCosts = false,
}: IComponentProps) {
  const stage = release.stages.find((stage) => stage.id === task.stageId);
  const person = people.find((person) => person.id === task.assignee);
  const isManager = audience === "manager";

  return (
    <article
      data-ds-block="crm.widget.task-detail"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="widget"
      data-variant="task-detail"
      className="grid min-w-0 gap-5 break-words bg-background text-foreground"
    >
      <header className="grid gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {isManager && (
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">
              {task.id}
            </span>
          )}
          <TaskStatus state={task.state} />
        </div>
        <h2 className="font-primary text-2xl leading-tight font-semibold tracking-tight">
          {task.label}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {isManager
            ? `${task.customer} · ${release.title} · Версия ${release.version}`
            : release.title}
        </p>
      </header>

      <dl className="grid gap-4 rounded-xl border border-border bg-muted/45 p-4 text-sm sm:grid-cols-2">
        {isManager && (
          <>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">Этап</dt>
              <dd className="font-medium">
                {stage?.title ?? "Этап недоступен"}
              </dd>
              {stage?.archived && (
                <dd className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Archive aria-hidden="true" className="size-3.5" /> Архивный
                  этап
                </dd>
              )}
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">
                Исполнитель
              </dt>
              <dd>
                <Assignee person={person} />
              </dd>
            </div>
          </>
        )}
        <div>
          <dt className="mb-1 text-xs text-muted-foreground">Срок</dt>
          <dd>
            <DueDate value={task.dueAt} />
          </dd>
        </div>
        {task.waitingFor && (
          <div>
            <dt className="mb-1 text-xs text-muted-foreground">Ожидаем</dt>
            <dd className="font-medium">{task.waitingFor}</dd>
          </div>
        )}
      </dl>

      {isManager && (
        <>
          <DetailSection Icon={History} title="История этапов">
            <ol className="grid gap-3">
              {[...task.history].reverse().map((entry) => (
                <li
                  key={entry.id}
                  className="grid gap-1 rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <p className="font-medium">
                    {release.stages.find((item) => item.id === entry.stageId)
                      ?.title ?? "Этап недоступен"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={entry.at}>
                      {timestampLabel(entry.at, true)}
                    </time>{" "}
                    · {entry.actor}
                  </p>
                  <p className="leading-5">{entry.reason}</p>
                  {entry.evidence && (
                    <p className="rounded bg-muted px-2 py-1.5 text-xs leading-5">
                      {entry.evidence}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </DetailSection>
          <DetailSection Icon={UsersRound} title="Назначения и передачи">
            <ul className="grid gap-3">
              {[...task.assignments].reverse().map((assignment) => (
                <li key={assignment.id} className="grid gap-1 text-sm">
                  <Assignee
                    person={people.find(
                      (person) => person.id === assignment.assignee,
                    )}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    <time dateTime={assignment.at}>
                      {timestampLabel(assignment.at, true)}
                    </time>{" "}
                    · {assignment.reason}
                  </p>
                </li>
              ))}
            </ul>
          </DetailSection>
        </>
      )}

      {isManager && task.thread && (
        <DetailSection Icon={MessageSquare} title="Тред">
          <div className="rounded-lg border border-border bg-card p-3 text-sm">
            <p className="font-medium">{task.thread.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {task.thread.id}
            </p>
            <blockquote className="mt-2 border-s-2 border-border ps-2.5 leading-6">
              {task.thread.latestMessage}
            </blockquote>
          </div>
        </DetailSection>
      )}

      {task.order && (
        <DetailSection Icon={ClipboardList} title="Заказ">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <p className="font-medium">
              #{task.order.id} · {task.order.title}
            </p>
            <p className="text-muted-foreground">{task.order.state}</p>
          </div>
        </DetailSection>
      )}

      {!isManager && task.terms && (
        <DetailSection Icon={ClipboardList} title="Условия">
          <p className="text-sm leading-6">{task.terms}</p>
        </DetailSection>
      )}

      {task.result && (
        <DetailSection Icon={FolderOpen} title="Результат">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <p className="font-medium">
              {task.result.title} · {task.result.version}
            </p>
            <p className="text-muted-foreground">{task.result.status}</p>
          </div>
        </DetailSection>
      )}

      {isManager && canReadCosts && (
        <DetailSection Icon={ReceiptText} title="Попытки и расходы">
          {task.costs.length ? (
            <ul className="grid gap-2">
              {task.costs.map((charge) => (
                <li
                  key={charge.id}
                  className="rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2 font-medium">
                    <p>{charge.title}</p>
                    <p>{charge.amount}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {charge.id} · {charge.status} ·{" "}
                    <time dateTime={charge.at}>
                      {timestampLabel(charge.at)}
                    </time>
                  </p>
                  {charge.transfer && (
                    <p className="mt-2 text-xs leading-5">
                      <span className="font-medium">Перевод</span> ·{" "}
                      {charge.transfer}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Расходов по задаче пока нет.
            </p>
          )}
        </DetailSection>
      )}

      {isManager && (
        <a
          href={taskHref(task.id)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Открыть прямую ссылку{" "}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      )}
    </article>
  );
}
