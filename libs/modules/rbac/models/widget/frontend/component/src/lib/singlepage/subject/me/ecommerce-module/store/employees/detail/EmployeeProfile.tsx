"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceTask,
  IModel as ISubject,
} from "@sps/rbac/models/subject/sdk/model";
import { Bot, ChevronRight, MessageSquare, UserRound } from "lucide-react";
import Link from "next/link";
import { memo, useRef, useState } from "react";
import {
  primaryClass,
  secondaryClass,
  storeList,
  TaskStatus,
} from "../../../../../../subject-me-crm-module-store-workspace/primitives";
import {
  hasStatus,
  taskHref,
} from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { useSearchParams } from "next/navigation";

interface IEmployeeProfileProps {
  actor: ISubject;
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
}

interface IEmployeeTaskProps {
  task: ICrmWorkspaceTask;
  href: string;
  language: string;
}

const EmployeeTask = memo(function EmployeeTask({
  task,
  href,
  language,
}: IEmployeeTaskProps) {
  const ru = language === "ru";
  return (
    <li>
      <Link
        href={href}
        className={`${storeList.row} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}
      >
        <div className="grid min-w-0 gap-1">
          <span className="wrap-anywhere font-semibold">{task.label}</span>
          <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {task.customerName && (
              <div className="min-w-0">
                <dt className="sr-only">{ru ? "Клиент" : "Customer"}</dt>
                <dd className="flex min-w-0 items-center gap-1.5 wrap-anywhere">
                  <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                  {task.customerName}
                </dd>
              </div>
            )}
            {task.stageName && (
              <div className="flex min-w-0 flex-wrap gap-x-1.5">
                <dt>{ru ? "Этап" : "Stage"}</dt>
                <dd className="min-w-0 wrap-anywhere">{task.stageName}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
          <TaskStatus
            state={task.outcome === "completed" ? "completed" : task.status}
            language={language}
          />
        </div>
        <ChevronRight
          className={`${storeList.arrow} col-start-2 row-span-2 row-start-1 sm:col-auto sm:row-auto`}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
});

function EmployeeTasks({
  actor,
  subjectId,
  storeId,
  storeSlug,
  language,
}: IEmployeeProfileProps) {
  const ru = language === "ru";
  const [cursors, setCursors] = useState<string[]>([]);
  const tasks = api.crmWorkspace.useTasks(
    {
      id: actor.id,
      params: {
        storeId,
        assigneeId: subjectId,
        limit: 20,
        current: true,
        includeStageNames: true,
        cursor: cursors.at(-1),
      },
    },
    true,
  );
  const denied = hasStatus(tasks.error, 401, 403);
  const data = denied ? undefined : tasks.data;

  return (
    <section className={storeList.panel} aria-labelledby="employee-tasks-title">
      <h2 id="employee-tasks-title" className="text-xl font-semibold">
        {ru ? "Текущие задачи" : "Current tasks"}
      </h2>
      {data ? (
        <>
          {data.items.length ? (
            <ul className="grid gap-2">
              {data.items.map((task) => (
                <EmployeeTask
                  key={task.id}
                  task={task}
                  href={taskHref(language, storeSlug, task.id)}
                  language={language}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ru ? "Текущих задач нет." : "There are no current tasks."}
            </p>
          )}
          {(cursors.length > 0 || data.nextCursor) && (
            <div className="flex gap-2">
              <button
                type="button"
                className={secondaryClass}
                disabled={!cursors.length}
                onClick={() => setCursors((value) => value.slice(0, -1))}
              >
                {ru ? "Назад" : "Previous"}
              </button>
              <button
                type="button"
                className={secondaryClass}
                disabled={!data.nextCursor}
                onClick={() => {
                  const cursor = data.nextCursor;
                  if (cursor) setCursors((value) => [...value, cursor]);
                }}
              >
                {ru ? "Далее" : "Next"}
              </button>
            </div>
          )}
        </>
      ) : tasks.isPending ? (
        <p role="status">{ru ? "Загружаем задачи…" : "Loading tasks…"}</p>
      ) : (
        <div className="grid gap-2">
          <p role="alert">
            {ru ? "Задачи недоступны." : "Tasks are unavailable."}
          </p>
          {!denied && (
            <button
              type="button"
              className={`${secondaryClass} w-fit`}
              onClick={() => void tasks.refetch()}
            >
              {ru ? "Повторить" : "Retry"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function EmployeeProfile(props: IEmployeeProfileProps) {
  const { actor, subjectId, storeId, language } = props;
  const ru = language === "ru";
  const profile = api.crmWorkspace.useEmployee({
    id: actor.id,
    params: { storeId, subjectId },
  });
  const command = api.crmWorkspace.useCommand(actor.id);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const threadRequest = useRef<{ title: string; key: string } | null>(null);
  const unavailable = hasStatus(profile.error, 401, 403, 404, 422);
  const employee = unavailable ? undefined : profile.data;
  if (!employee) {
    return (
      <StoreSectionStatus
        language={language}
        deniedMessage={
          ru
            ? "Сотрудник недоступен в этом магазине."
            : "This employee is unavailable in this store."
        }
        session={{
          pending: profile.isPending,
          retry:
            profile.isError && !unavailable
              ? () => void profile.refetch()
              : undefined,
        }}
      />
    );
  }

  async function openChat() {
    setError("");
    try {
      await command.mutateAsync({
        kind: "open-employee-chat",
        employee: { storeId, subjectId },
      });
    } catch {
      setError(
        ru
          ? "Не удалось открыть чат. Повторите попытку."
          : "Could not open the chat. Try again.",
      );
    }
  }

  const training = employee.training;
  const employeePath = `/${language}/ecommerce/stores/${props.storeSlug}/employees/${subjectId}`;
  function getThreadHref(threadId: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (threadId === training?.threadId) params.delete("thread");
    else params.set("thread", threadId);
    const query = params.toString();
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    return employeePath + (query ? "?" + query : "") + hash;
  }

  async function createThread(title: string) {
    if (threadRequest.current?.title !== title) {
      threadRequest.current = { title, key: crypto.randomUUID() };
    }
    const result = await command.mutateAsync({
      kind: "create-employee-thread",
      employee: {
        storeId,
        subjectId,
        title,
        operationKey: threadRequest.current.key,
      },
    });
    if (result.kind !== "create-employee-thread") {
      throw new Error("Unexpected employee thread response");
    }
    threadRequest.current = null;
    return result.data.threadId;
  }

  const Icon = employee.kind === "ai" ? Bot : UserRound;
  return (
    <div className="grid w-full min-w-0 gap-6">
      <header className="flex min-w-0 items-center gap-4 rounded-2xl border border-l-4 border-border border-l-primary bg-card p-4 sm:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div className="grid min-w-0 gap-1">
          <p className="text-sm font-medium text-muted-foreground">
            {employee.kind === "ai"
              ? ru
                ? "ИИ-сотрудник"
                : "AI employee"
              : ru
                ? "Сотрудник магазина"
                : "Store employee"}
          </p>
          <h1 className="min-w-0 wrap-anywhere text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {employee.name}
          </h1>
        </div>
      </header>
      {employee.canTrain && (
        <section
          className={storeList.panel}
          aria-labelledby="employee-chat-title"
        >
          <h2 id="employee-chat-title" className="text-xl font-semibold">
            {ru ? "Служебный чат" : "Staff chat"}
          </h2>
          {training ? (
            <Subject
              key={training.chatId}
              isServer={false}
              variant="social-module-profile-chat-overview-default"
              data={actor}
              language={language}
              socialModuleProfile={training.actorProfile}
              socialModuleChatId={training.chatId}
              socialModuleThreadId={
                searchParams?.get("thread") ?? training.threadId
              }
              socialModuleEmployeeProfileId={training.profileId}
              defaultThreadId={training.threadId}
              threadListLimit={training.threads?.length}
              getThreadHref={getThreadHref}
              onCreateThread={createThread}
              isCreatingThread={command.isPending}
            />
          ) : (
            <div className="grid justify-items-start gap-2">
              <button
                type="button"
                className={primaryClass}
                disabled={command.isPending}
                onClick={() => void openChat()}
              >
                <MessageSquare aria-hidden="true" className="size-4" />
                {ru ? "Подключить служебный чат" : "Set up staff chat"}
              </button>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </section>
      )}
      <EmployeeTasks {...props} />
    </div>
  );
}
