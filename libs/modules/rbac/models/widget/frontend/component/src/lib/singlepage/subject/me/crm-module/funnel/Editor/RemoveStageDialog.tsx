import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  settingsFormStyles,
} from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { useState } from "react";
import { Field } from "../../../../../subject-me-crm-module-store-workspace/Fields";

interface IRemoveStageDialogProps {
  stage: IFunnelStage;
  persisted: boolean;
  stages: IFunnelStage[];
  pending: boolean;
  disabled: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (targetStageId: string) => void;
}

export function RemoveStageDialog({
  stage,
  persisted,
  stages,
  pending,
  disabled,
  error,
  onClose,
  onConfirm,
}: IRemoveStageDialogProps) {
  const options = stages.filter(
    (item) => item.id !== stage.id && !item.archived,
  );
  const next = stages
    .slice(stages.findIndex(({ id }) => id === stage.id) + 1)
    .find((item) => !item.archived);
  const [targetId, setTargetId] = useState(
    next?.id ?? options.at(-1)?.id ?? "",
  );
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent className={settingsFormStyles.panel}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Удалить этап «{stage.name.trim() || "Новый этап"}»?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {persisted
              ? "Открытые задачи перейдут на выбранный этап. История задач сохранится."
              : "Черновик этапа и его несохранённые настройки будут удалены."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {persisted && (
          <Field label="Перевести открытые задачи на этап">
            <Select
              ui="shadcn"
              className={settingsFormStyles.field}
              disabled={disabled}
              value={targetId}
              onValueChange={setTargetId}
              options={options.map(({ id, name }) => ({
                value: id,
                label: name,
              }))}
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={pending}
            className={settingsFormStyles.secondary}
          >
            Отмена
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || !targetId}
            onClick={() => onConfirm(targetId)}
          >
            {pending ? "Удаляем…" : "Подтвердить удаление"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
