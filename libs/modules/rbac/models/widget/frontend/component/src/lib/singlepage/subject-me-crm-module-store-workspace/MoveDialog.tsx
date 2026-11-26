import { Select } from "@sps/ui-adapter";
import { MoveRight } from "lucide-react";
import { useState } from "react";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceTask,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "./Fields";
import {
  Dialog,
  DialogClose,
  SettingsDialogContent,
  SettingsDialogHeader,
  settingsFormStyles,
} from "@sps/shared-ui-shadcn";
import { manualActions } from "./view-model";

type TMove = Extract<
  TCrmWorkspaceCommand,
  { kind: "transition" }
>["transition"];

interface IMoveDialogProps {
  task: ICrmWorkspaceTask;
  stages: IFunnelStage[];
  destinationId?: string;
  onClose: () => void;
  onRestoreFocus: () => void;
  onSubmit: (input: TMove) => void;
}

export function MoveDialog({
  task,
  stages,
  destinationId,
  onClose,
  onRestoreFocus,
  onSubmit,
}: IMoveDialogProps) {
  const stage = stages.find((item) => item.id === task.stageId);
  const actions = manualActions(stage).filter((action) =>
    stages.some((item) => item.id === action.nextStageId && !item.archived),
  );
  const [selected, setSelected] = useState(
    actions.find((action) => action.nextStageId === destinationId)?.id ?? "",
  );
  const selectedAction = actions.find((action) => action.id === selected);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SettingsDialogContent
        closeLabel="Закрыть"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <SettingsDialogHeader
          title="Переместить задачу"
          description={[task.label, stage?.name].filter(Boolean).join(" · ")}
        />
        {destinationId &&
          !actions.some((action) => action.nextStageId === destinationId) && (
            <p
              role="status"
              className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"
            >
              Этот переход недоступен для текущего этапа задачи.
            </p>
          )}
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !selectedAction ||
              !reason.trim() ||
              (stage?.evidenceInstruction && !evidence.trim())
            )
              return;
            onSubmit({
              storeId: task.storeId,
              taskId: task.id,
              expectedRevision: task.revision,
              actionId: selectedAction.id,
              operationKey: crypto.randomUUID(),
              reason,
              evidence,
            });
          }}
        >
          <Field label="Переместить в…">
            <Select
              ui="shadcn"
              className={settingsFormStyles.field}
              required
              value={selectedAction?.id ?? ""}
              onValueChange={setSelected}
              placeholder="Выберите этап"
              contentClassName="z-[80]"
              options={actions.map((action) => {
                const stage = stages.find(
                  (item) => item.id === action.nextStageId,
                );
                return {
                  value: action.id,
                  label: stage ? `${stage.name} · ${action.name}` : action.name,
                };
              })}
            />
          </Field>
          <Field label="Причина перехода">
            <textarea
              className={settingsFormStyles.textarea}
              required
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
            />
          </Field>
          <Field label="Доказательство" hint={stage?.evidenceInstruction}>
            <textarea
              className={settingsFormStyles.textarea}
              required={Boolean(stage?.evidenceInstruction)}
              maxLength={1900}
              value={evidence}
              onChange={(event) => setEvidence(event.currentTarget.value)}
            />
          </Field>
          <div className={settingsFormStyles.actions}>
            <DialogClose className={settingsFormStyles.secondary}>
              Отмена
            </DialogClose>
            <button
              className={settingsFormStyles.primary}
              disabled={!selectedAction}
            >
              <MoveRight aria-hidden="true" className="size-4" /> Переместить
            </button>
          </div>
        </form>
      </SettingsDialogContent>
    </Dialog>
  );
}
