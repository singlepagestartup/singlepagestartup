"use client";

import { MoveRight } from "lucide-react";
import { useRef, useState } from "react";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceStore } from "@sps/rbac/models/subject/sdk/model";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../../ecommerce-module/store/StoreSection";
import { StoreSectionStatus } from "../../../ecommerce-module/store/StoreSectionStatus";
import { MoveDialog } from "../../../../../subject-me-crm-module-store-workspace/MoveDialog";
import { secondaryClass } from "../../../../../subject-me-crm-module-store-workspace/primitives";
import {
  hasStatus,
  manualActions,
} from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { TaskOverview } from "./TaskOverview";
import { TaskAssignee } from "./TaskAssignee";
import { TaskConversation } from "./TaskConversation";

interface IClientProps extends IStoreSectionContentProps {
  crmModuleTaskId: string;
}

interface ITaskForStoreProps {
  subjectId: string;
  store: ICrmWorkspaceStore;
  taskId: string;
  language: string;
  orderId?: string;
}

export function TaskForStore({
  subjectId,
  store,
  taskId,
  orderId,
  language,
}: ITaskForStoreProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const moveButton = useRef<HTMLButtonElement>(null);
  const [moveFailure, setMoveFailure] = useState("");
  const detail = api.crmWorkspace.useDetail({
    id: subjectId,
    params: { storeId: store.id, taskId },
  });
  const command = api.crmWorkspace.useCommand(subjectId);
  const ru = language === "ru";

  if (hasStatus(detail.error, 401, 403, 404)) {
    return (
      <p role="alert">{ru ? "Задача недоступна." : "Task unavailable."}</p>
    );
  }
  if (!detail.data && detail.isError) {
    return (
      <div className="grid gap-3">
        <p role="alert">
          {ru ? "Не удалось загрузить задачу." : "Could not load the task."}
        </p>
        <button
          type="button"
          onClick={() => void detail.refetch()}
          className={`${secondaryClass} w-fit`}
        >
          {ru ? "Повторить" : "Retry"}
        </button>
      </div>
    );
  }
  if (!detail.data) {
    return <p role="status">{ru ? "Загружаем задачу…" : "Loading task…"}</p>;
  }

  const data = detail.data;
  const { task, thread } = data;
  const stages = data.funnel.definition.stages;
  const stage = stages.find(({ id }) => id === task.stageId);
  const canManageOpenTask = data.canManageTasks && task.status !== "closed";
  const canMove = canManageOpenTask && manualActions(stage).length > 0;
  const conversation = (
    <TaskConversation
      key={`${store.id}:${taskId}:${subjectId}`}
      subjectId={subjectId}
      storeId={store.id}
      taskId={taskId}
      thread={thread}
      language={language}
    />
  );
  const assign: React.ComponentProps<typeof TaskAssignee>["onAssign"] = async (
    assignment,
  ) => {
    try {
      await command.mutateAsync({ kind: "assign", assignment });
    } catch (error) {
      if (hasStatus(error, 409)) await detail.refetch();
      throw error;
    }
  };
  if (orderId) {
    return data.order?.id === orderId ? conversation : null;
  }
  return (
    <>
      {moveFailure && (
        <p role="alert" className="text-sm text-destructive">
          {moveFailure}
        </p>
      )}
      <TaskOverview
        language={language}
        storeSlug={store.slug}
        detail={data}
        commandPending={command.isPending}
        onAssign={assign}
        onFulfill={(fulfillment) =>
          command.mutateAsync({ kind: "fulfill", fulfillment })
        }
        moveAction={
          canMove && (
            <button
              type="button"
              ref={moveButton}
              className={secondaryClass}
              disabled={command.isPending}
              onClick={() => setMoveOpen(true)}
            >
              <MoveRight aria-hidden="true" className="size-4" />
              {ru ? "Сменить этап" : "Move task"}
            </button>
          )
        }
        thread={conversation}
      />
      {moveOpen && (
        <MoveDialog
          task={task}
          stages={stages}
          onClose={() => setMoveOpen(false)}
          onRestoreFocus={() => moveButton.current?.focus()}
          onSubmit={(transition) => {
            setMoveOpen(false);
            setMoveFailure("");
            void command
              .mutateAsync({ kind: "transition", transition })
              .catch(() => {
                setMoveFailure(
                  ru
                    ? "Не удалось сменить этап задачи."
                    : "Could not move the task.",
                );
              });
          }}
        />
      )}
    </>
  );
}

export function ClientComponent({
  widgetId,
  crmModuleTaskId,
  ecommerceModuleStore,
  language,
}: IClientProps) {
  const ru = language === "ru";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="tasks"
      taskAccess
    >
      {(session) =>
        session.access && crmModuleTaskId ? (
          <TaskForStore
            key={`${session.access.subjectId}:${crmModuleTaskId}`}
            taskId={crmModuleTaskId}
            language={language}
            subjectId={session.access.subjectId}
            store={session.access.store}
          />
        ) : (
          <StoreSectionStatus
            language={language}
            session={session}
            deniedMessage={ru ? "Задача недоступна." : "Task unavailable."}
          />
        )
      }
    </StoreSection>
  );
}
