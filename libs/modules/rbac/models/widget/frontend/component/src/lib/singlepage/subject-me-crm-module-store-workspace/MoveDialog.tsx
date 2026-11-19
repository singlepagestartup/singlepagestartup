import * as Dialog from "@radix-ui/react-dialog";
import { MoveRight, X } from "lucide-react";
import { useState } from "react";
import type {
  ICrmWorkspacePublication,
  ICrmWorkspaceTask,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "./Editor/Fields";
import { dialogOverlay } from "./TaskDrawer";
import {
  fieldClass,
  iconButtonClass,
  primaryClass,
  secondaryClass,
} from "./primitives";
import { manualActions } from "./view-model";

type TMove = Extract<
  TCrmWorkspaceCommand,
  { kind: "transition" }
>["transition"];

interface IMoveDialogProps {
  task: ICrmWorkspaceTask;
  publication: ICrmWorkspacePublication;
  destinationId?: string;
  onClose: () => void;
  onRestoreFocus: () => void;
  onSubmit: (input: TMove) => void;
}

export function MoveDialog({
  task,
  publication,
  destinationId,
  onClose,
  onRestoreFocus,
  onSubmit,
}: IMoveDialogProps) {
  const stages = publication.definition.stages;
  const stage = stages.find((item) => item.id === task.stageId);
  const actions = manualActions(stage).filter((action) =>
    stages.some((item) => item.id === action.nextStageId && !item.archived),
  );
  const [selected, setSelected] = useState(
    actions.find((action) => action.nextStageId === destinationId)?.id ?? "",
  );
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

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
          className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-4 text-foreground shadow-xl sm:p-5"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                Переместить задачу
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {task.label} · {stage?.name}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Закрыть" className={iconButtonClass}>
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          {destinationId &&
            !actions.some((action) => action.nextStageId === destinationId) && (
              <p
                role="status"
                className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"
              >
                Выбранный переход отсутствует в опубликованной версии.
              </p>
            )}
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !selected ||
                !reason.trim() ||
                (stage?.evidenceInstruction && !evidence.trim())
              )
                return;
              onSubmit({
                storeId: task.storeId,
                taskId: task.id,
                expectedRevision: task.revision,
                actionId: selected,
                operationKey: crypto.randomUUID(),
                reason,
                evidence,
              });
            }}
          >
            <Field label="Переместить в…">
              <select
                className={fieldClass}
                required
                value={selected}
                onChange={(event) => setSelected(event.currentTarget.value)}
              >
                <option value="">Выберите этап</option>
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {
                      stages.find((item) => item.id === action.nextStageId)
                        ?.name
                    }{" "}
                    · {action.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Причина перехода">
              <textarea
                className={fieldClass}
                required
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
            </Field>
            <Field label="Доказательство" hint={stage?.evidenceInstruction}>
              <textarea
                className={fieldClass}
                required={Boolean(stage?.evidenceInstruction)}
                maxLength={1900}
                value={evidence}
                onChange={(event) => setEvidence(event.currentTarget.value)}
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Dialog.Close className={secondaryClass}>Отмена</Dialog.Close>
              <button className={primaryClass} disabled={!selected}>
                <MoveRight aria-hidden="true" className="size-4" /> Переместить
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
