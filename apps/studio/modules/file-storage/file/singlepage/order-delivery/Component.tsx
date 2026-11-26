import { Component as SharedIcon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";

export function Component({ state, files, onDownload }: IComponentProps) {
  return (
    <section
      data-ds-block="file-storage.file.order-delivery"
      data-ds-layer="singlepage"
      data-module="file-storage"
      data-model="file"
      data-variant="order-delivery"
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <SharedIcon variant="phosphor" name="lock-key" size={20} /> Файлы заказа
      </h2>
      {state === "pending" && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Оплата подтверждена. Готовим файлы к скачиванию.
        </p>
      )}
      {state === "denied" && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          У этой учётной записи нет доступа к файлам заказа.
        </p>
      )}
      {state === "available" && (
        <ul className="mt-4 space-y-2">
          {files?.map((file) => (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => onDownload(file.id)}
                aria-label={
                  file.kind === "result"
                    ? `Скачать ${file.filename}`
                    : "Скачать чек"
                }
                className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SharedIcon
                  variant="phosphor"
                  name="file-text"
                  size={20}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">
                    {file.kind === "result" ? "Оригинал" : "Чек"}
                  </span>
                  <span className="mt-0.5 block break-all text-xs text-muted-foreground">
                    {file.filename}
                  </span>
                </span>
                <SharedIcon
                  variant="phosphor"
                  name="arrow-down"
                  size={20}
                  className="shrink-0 text-muted-foreground group-hover:text-foreground"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
