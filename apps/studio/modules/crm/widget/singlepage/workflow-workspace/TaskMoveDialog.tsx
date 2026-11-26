import * as Dialog from "@radix-ui/react-dialog";
import { Archive, MoveRight, X } from "lucide-react";
import { useState } from "react";
import {
  fieldClass,
  iconButtonClass,
  primaryClass,
  secondaryClass,
} from "../../../shared/workflow-ui";
import type { Workflow, WorkflowTask } from "../../../shared/workflows";
import { Field } from "../workflow-editor/Fields";

export interface MoveInput {
  taskId: string;
  stageId: string;
  expectedRevision: number;
  reason: string;
  evidence: string;
}

interface TaskMoveDialogProps {
  task: WorkflowTask;
  workflow: Workflow;
  initialStageId?: string;
  onClose: () => void;
  onRestoreFocus: () => void;
  onSubmit: (input: MoveInput) => void;
}

export const dialogOverlay = "fixed inset-0 z-50 bg-slate-950/45";
const moveDialog =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl sm:p-5";

export function TaskMoveDialog({
  task,
  workflow,
  initialStageId,
  onClose,
  onRestoreFocus,
  onSubmit,
}: TaskMoveDialogProps) {
  const [toStageId, setToStageId] = useState(initialStageId ?? "");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const currentStage = workflow.stages.find(
    (stage) => stage.id === task.stageId,
  );
  const nextStages = workflow.stages.filter(
    (stage) => stage.id !== task.stageId && !stage.archived,
  );
  const selected = nextStages.find((stage) => stage.id === toStageId);
  const evidenceRequired = Boolean(currentStage?.evidence);
  const domainConfirmationRequired =
    currentStage?.waitFor === "payment-confirmed" ||
    currentStage?.waitFor === "delivery-confirmed";

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content
          data-sps-theme="singlepage"
          className={`${moveDialog} font-default`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-primary text-xl font-semibold tracking-tight">
                Переместить задачу
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                {task.id} · {task.label}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Закрыть" className={iconButtonClass}>
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          <form
            className="grid gap-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !selected ||
                domainConfirmationRequired ||
                !reason.trim() ||
                (evidenceRequired && !evidence.trim())
              )
                return;
              onSubmit({
                taskId: task.id,
                stageId: selected.id,
                expectedRevision: task.revision,
                reason: reason.trim(),
                evidence: evidence.trim(),
              });
            }}
          >
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Текущий этап{" "}
              <span className="font-semibold text-foreground">
                {currentStage?.title}
              </span>
              {currentStage?.archived && (
                <>
                  <Archive aria-hidden="true" className="size-3.5" /> Архив
                </>
              )}
            </p>
            <Field label="Переместить в…">
              <select
                required
                className={fieldClass}
                value={toStageId}
                onChange={(event) => setToStageId(event.currentTarget.value)}
              >
                <option value="">Выберите этап</option>
                {nextStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Причина перехода">
              <textarea
                required
                className={`${fieldClass} min-h-16`}
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
            </Field>
            <Field
              label={
                evidenceRequired
                  ? "Доказательство"
                  : "Доказательство (при наличии)"
              }
              hint={currentStage?.evidence}
            >
              <textarea
                required={evidenceRequired}
                className={`${fieldClass} min-h-16`}
                value={evidence}
                onChange={(event) => setEvidence(event.currentTarget.value)}
                placeholder="Ссылка на сообщение или описание основания"
              />
            </Field>
            {domainConfirmationRequired && (
              <p
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
              >
                {currentStage.waitFor === "payment-confirmed"
                  ? "Переход доступен после подтверждения платежа платёжным доменом."
                  : "Переход доступен после подтверждения выдачи результата."}
              </p>
            )}
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <Dialog.Close className={secondaryClass}>Отмена</Dialog.Close>
              <button
                type="submit"
                disabled={!selected || domainConfirmationRequired}
                className={primaryClass}
              >
                <MoveRight aria-hidden="true" className="size-4" /> Переместить
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
