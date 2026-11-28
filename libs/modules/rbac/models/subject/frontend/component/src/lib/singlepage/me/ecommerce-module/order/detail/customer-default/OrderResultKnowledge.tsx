"use client";

import { useCallback } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ISubjectCustomerOrderDetails } from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { FilePreview } from "@sps/ui-adapter";

interface IProps {
  subjectId: string;
  orderId: string;
  result: NonNullable<ISubjectCustomerOrderDetails["deliveredResult"]>;
  language: string;
}

export function OrderResultKnowledge({
  subjectId,
  orderId,
  result,
  language,
}: IProps) {
  const ru = language === "ru";
  const mutation = api.orderWork.setArtifactKnowledge();
  const load = useCallback(
    (signal?: AbortSignal, maxBytes?: number) =>
      api.orderWork.content({
        id: subjectId,
        orderId,
        artifactId: result.id,
        options: { signal },
        maxBytes,
      }),
    [subjectId, orderId, result.id],
  );
  const saved = result.savedToKnowledge;
  const saveLabel = ru ? "Сохранить в знания" : "Save to knowledge";
  const removeLabel = ru
    ? "Удалить из знаний профиля"
    : "Remove from profile knowledge";
  const savingLabel = ru ? "Сохраняем и индексируем…" : "Saving and indexing…";
  const removingLabel = ru ? "Удаляем…" : "Removing…";
  const label = saved ? removeLabel : saveLabel;
  const pending = saved ? removingLabel : savingLabel;
  return (
    <div
      id={`result-${result.versionId}`}
      className="mt-3 grid gap-3 border-t border-border pt-5"
    >
      <FilePreview
        name={result.name}
        mimeType={result.mimeType}
        language={language}
        onDownload={load}
      />
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            id: subjectId,
            orderId,
            artifactId: result.id,
            method: saved ? "DELETE" : "POST",
          })
        }
      >
        {mutation.isPending ? pending : label}
      </Button>
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "В знаниях вашего профиля" : "In your profile knowledge"}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {ru
            ? "Не удалось обновить знания профиля. Повторите попытку."
            : "Couldn’t update your profile knowledge. Try again."}
        </p>
      )}
    </div>
  );
}
