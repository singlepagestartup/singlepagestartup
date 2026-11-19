"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICustomerWorkMemory,
  ICustomerWorkScope,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";

type TMemoryCommand = Extract<
  TCustomerWorkCommand,
  { operation: "memory-project" | "remember" | "forget" }
>;
type TChange = TMemoryCommand extends infer Command
  ? Command extends TMemoryCommand
    ? Omit<Command, "storeId" | "taskId" | "operationKey">
    : never
  : never;

interface IProps {
  subjectId: string;
  work: ICustomerWorkScope;
  memory: ICustomerWorkMemory;
  language: string;
}

export function PersonalNotes({ subjectId, work, memory, language }: IProps) {
  const ru = language === "ru";
  const mutation = api.changeCustomerWork();
  const [editing, setEditing] = useState<string>();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const previous = useRef<{ signature: string; key: string }>(undefined);

  async function change(data: TChange) {
    if (mutation.isPending) {
      return;
    }
    const signature = JSON.stringify(data);
    if (previous.current?.signature !== signature) {
      previous.current = { signature, key: crypto.randomUUID() };
    }
    setError("");
    setStatus("");
    try {
      await mutation.mutateAsync({
        id: subjectId,
        data: {
          ...data,
          storeId: work.storeId,
          taskId: work.taskId,
          operationKey: previous.current.key,
        },
      });
      previous.current = undefined;
      setEditing(undefined);
      setText("");
      setStatus(ru ? "Сохранено." : "Saved.");
    } catch {
      setError(
        ru
          ? "Не удалось сохранить изменение."
          : "The change could not be saved.",
      );
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (value) {
      void change({ operation: "remember", sourceId: editing, text: value });
    }
  }

  return (
    <details className="border-t border-border px-4 sm:px-5">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
        {ru
          ? "Личные заметки для ассистента"
          : "Personal notes for the assistant"}
      </summary>
      <div className="space-y-3 pb-4">
        {memory.projects.length > 0 && (
          <label className="block text-sm font-medium">
            {ru ? "Область заметки" : "Note scope"}
            <select
              value={memory.currentProjectId ?? ""}
              disabled={mutation.isPending}
              onChange={(event) =>
                void change({
                  operation: "memory-project",
                  projectId: event.currentTarget.value || null,
                })
              }
              className="mt-1 block min-h-11 w-full rounded-lg border border-input bg-background px-3"
            >
              <option value="">{ru ? "Этот магазин" : "This store"}</option>
              {memory.projects.map(({ id, title }) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
        )}
        <ul className="space-y-2">
          {memory.notes.map(({ id, text }) => (
            <li key={id} className="rounded-lg border border-border p-3">
              <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setEditing(id);
                    setText(text);
                  }}
                >
                  {ru ? "Изменить" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={mutation.isPending}
                  onClick={() =>
                    void change({ operation: "forget", sourceId: id })
                  }
                >
                  {ru ? "Удалить" : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={save} className="space-y-2">
          <label className="block text-sm font-medium">
            {editing
              ? ru
                ? "Изменить заметку"
                : "Edit note"
              : ru
                ? "Что запомнить"
                : "What to remember"}
            <textarea
              value={text}
              rows={2}
              maxLength={2000}
              required
              onChange={(event) => setText(event.currentTarget.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
          <Button
            type="submit"
            variant="outline"
            className="min-h-11"
            disabled={!text.trim() || mutation.isPending}
          >
            {ru ? "Сохранить заметку" : "Save note"}
          </Button>
        </form>
        {status && (
          <p role="status" className="text-sm">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
