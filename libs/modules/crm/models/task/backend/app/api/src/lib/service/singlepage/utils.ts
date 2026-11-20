import { createHash } from "node:crypto";
import type {
  IFunnelDefinition,
  IFunnelStage,
  TActorKind,
  TTaskOutcome,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  IModel as ITask,
  TTaskEvidence,
} from "@sps/crm/models/task/sdk/model";

export function operationDigest(kind: string, data: object) {
  return createHash("sha256")
    .update(JSON.stringify({ kind, data }))
    .digest("hex");
}

export function getStage(definition: IFunnelDefinition, stageId: string) {
  const stage = definition.stages.find((entry) => entry.id === stageId);
  if (!stage || stage.archived) {
    throw new Error(
      "Validation error. Stage does not exist in the funnel publication",
    );
  }
  return stage;
}

export function trainEmployeeStage(id: string): IFunnelStage {
  return {
    id,
    name: "Employee training",
    output: "chat",
    instruction:
      "This is a private conversation with store staff. Answer their questions about the employee's work and discuss proposed instructions. Only the explicit save command can change stored knowledge. Never claim to have saved a note or taken an action.",
    actions: [],
  };
}

export function assertOpen(task: ITask) {
  if (task.status === "closed") {
    throw new Error("Conflict error. The task is closed");
  }
}

export function assertAssignment(
  task: ITask,
  actorId: string,
  assignmentRevision: number | undefined,
  now: Date,
) {
  if (
    task.assigneeId !== actorId ||
    task.assignmentRevision !== assignmentRevision
  ) {
    throw new Error("Conflict error. The task assignment has changed");
  }
  if (task.assignmentExpiresAt && task.assignmentExpiresAt <= now) {
    throw new Error("Conflict error. The task assignment has expired");
  }
}

export function assertEvidence(
  task: ITask,
  actorId: string,
  actorKind: TActorKind,
  assignmentRevision: number | undefined,
  evidence: TTaskEvidence,
  now: Date,
) {
  if (actorKind === "human" || actorKind === "ai") {
    assertAssignment(task, actorId, assignmentRevision, now);
    if (task.assigneeKind !== actorKind) {
      throw new Error(
        "Forbidden error. Actor kind differs from the assignment",
      );
    }
  }

  if (
    evidence.kind === "manual" &&
    actorKind !== "manager" &&
    actorKind !== "human"
  ) {
    throw new Error("Forbidden error. Manual evidence requires a human actor");
  }

  if (
    "orderId" in evidence &&
    (actorKind !== "system" || evidence.orderId !== task.orderId)
  ) {
    throw new Error(
      "Forbidden error. Commerce evidence must come from the system for this task's order",
    );
  }
}

export function clearWaiting() {
  return {
    expectedEvent: null,
    waitingRevision: null,
    waitingSince: null,
    deadlineAt: null,
    nextActionAt: null,
    timer: null,
  };
}

export function closeTask(outcome: TTaskOutcome) {
  return {
    ...clearWaiting(),
    status: "closed" as const,
    outcome,
  };
}

export function nextTimer(
  taskId: string,
  stage: IFunnelStage,
  waitingSince: Date,
  waitingRevision: number,
  assignmentRevision: number,
  remindersSent: number,
  now: Date,
) {
  const waiting = stage.waiting;
  if (!waiting) {
    throw new Error("Internal error. The waiting stage has no timer policy");
  }

  const deadlineAt = new Date(
    waitingSince.getTime() + waiting.deadlineSeconds * 1000,
  );
  const reminderAfter = waiting.reminderSeconds[remindersSent];
  if (reminderAfter !== undefined && deadlineAt > now) {
    const number = remindersSent + 1;
    const key = `${taskId}:${stage.id}:${waitingRevision}:${assignmentRevision}:reminder:${number}`;
    return {
      deadlineAt,
      nextActionAt: new Date(waitingSince.getTime() + reminderAfter * 1000),
      timer: { key, number, kind: "reminder" as const },
    };
  }

  return {
    deadlineAt,
    nextActionAt: deadlineAt,
    timer: {
      key: `${taskId}:${stage.id}:${waitingRevision}:${assignmentRevision}:deadline`,
      number: 0,
      kind: "deadline" as const,
    },
  };
}

export function enterStage(
  taskId: string,
  stage: IFunnelStage,
  revision: number,
  assignmentRevision: number,
  now: Date,
) {
  if (!stage.waiting) {
    return {
      ...clearWaiting(),
      stageId: stage.id,
      status: "active" as const,
      outcome: null,
    };
  }

  return {
    ...nextTimer(taskId, stage, now, revision, assignmentRevision, 0, now),
    stageId: stage.id,
    status: "waiting" as const,
    expectedEvent: stage.waiting.expectedEvent,
    waitingRevision: revision,
    waitingSince: now,
    outcome: null,
  };
}
