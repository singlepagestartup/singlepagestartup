import { memo, useCallback, useId, useRef, useState } from "react";
import { Button, Icon, kit, Specimen } from "./primitives";

export interface ILocalFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface IFileRowProps {
  file: ILocalFile;
  onRemove?: (id: string) => void;
}

export const FileRow = memo(function FileRow({
  file,
  onRemove,
}: IFileRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-3">
      <span className="rounded-lg bg-[var(--workspace-brand-background)] p-2">
        <Icon name="file-text" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium">{file.name}</p>
        <p className={`mt-1 break-words text-xs ${kit.muted}`}>
          {file.size < 1024
            ? `${file.size} B`
            : `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(file.size / 1024)} KB`}{" "}
          · {file.type || "Тип файла не указан"} · только локально
        </p>
      </div>
      {onRemove ? (
        <Button
          variant="plain"
          className="shrink-0 px-3"
          aria-label={`Remove ${file.name} из выбранного`}
          onClick={() => onRemove(file.id)}
        >
          <Icon name="x" />
        </Button>
      ) : null}
    </li>
  );
});

export default function Files() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ILocalFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [attachmentVisible, setAttachmentVisible] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const helpId = useId();
  const errorId = useId();
  const previewId = useId();
  const onRemove = useCallback(
    (id: string) =>
      setFiles((current) => current.filter((file) => file.id !== id)),
    [],
  );
  const acceptFiles = useCallback((selection: File[]) => {
    const accepted: ILocalFile[] = [];
    const rejected: string[] = [];
    for (const file of selection) {
      const supported =
        [
          "text/plain",
          "text/markdown",
          "application/pdf",
          "image/png",
          "image/jpeg",
        ].includes(file.type) ||
        (!file.type && /\.(txt|md|pdf|png|jpe?g)$/i.test(file.name));
      if (!supported)
        rejected.push(
          `${file.name}: выберите TXT, Markdown, PDF, PNG или JPEG.`,
        );
      else if (file.size > 10 * 1024 * 1024)
        rejected.push(`${file.name}: в примере допустимы файлы до 10 МБ.`);
      else
        accepted.push({
          id: `${file.name}:${file.size}:${file.lastModified}`,
          name: file.name,
          size: file.size,
          type: file.type,
        });
    }
    setErrors([...new Set(rejected)]);
    setFiles((current) => {
      const known = new Set(current.map((file) => file.id));
      return [
        ...current,
        ...accepted.filter((file) => {
          if (known.has(file.id)) return false;
          known.add(file.id);
          return true;
        }),
      ];
    });
  }, []);

  return (
    <div className="grid gap-6">
      <Specimen
        id="file-upload"
        title="Загрузка файлов"
        description="Выберите или перетащите локальные файлы, чтобы проверить тип и размер."
        states={[
          "Пусто",
          "Перетаскивание",
          "Выбрано",
          "Неверный тип",
          "Слишком большой",
          "Удалено",
        ]}
        usage="До выбора назовите типы и ограничения. Пример читает только метаданные, не загружает и не сохраняет содержимое."
        recipe="rounded-2xl border border-dashed border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6 text-center"
      >
        <div
          className={`rounded-2xl border border-dashed p-6 text-center ${dragging ? "border-[var(--workspace-brand-primary)] bg-[var(--workspace-brand-surface)] ring-2 ring-[var(--workspace-brand-accent)]" : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]"}`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            )
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--workspace-brand-surface)]">
            <Icon name="upload-simple" size={24} />
          </span>
          <p className="mt-4 text-base font-semibold">Перетащите файлы сюда</p>
          <p
            id={helpId}
            className={`mx-auto mt-2 max-w-lg text-sm ${kit.muted}`}
          >
            TXT, Markdown, PDF, PNG или JPEG. До 10 МБ каждый. Файлы остаются на
            устройстве.
          </p>
          <input
            ref={input}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.png,.jpg,.jpeg,text/plain,text/markdown,application/pdf,image/png,image/jpeg"
            className="hidden"
            aria-label="Выбрать файлы для локального просмотра"
            onChange={(event) => {
              acceptFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="mt-5"
            aria-describedby={`${helpId}${errors.length ? ` ${errorId}` : ""}`}
            onClick={() => input.current?.click()}
          >
            Выбрать локальные файлы
          </Button>
        </div>
        {errors.length ? (
          <div
            id={errorId}
            role="alert"
            className="mt-4 rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-4 text-sm text-[var(--workspace-brand-danger)]"
          >
            <p className="font-semibold">Некоторые файлы не добавлены</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li className="break-words" key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {files.length
            ? `${files.length} local ${files.length === 1 ? "файл выбран" : "файлов выбрано"}. Файлы ещё не загружены.`
            : "Файлы не выбраны."}
        </p>
        {files.length ? (
          <ul className="mt-4 grid gap-3">
            {files.map((file) => (
              <FileRow key={file.id} file={file} onRemove={onRemove} />
            ))}
          </ul>
        ) : null}
      </Specimen>

      <Specimen
        id="attachments"
        title="Вложения"
        description="Вложение показывает имя, тип и доступные локальные действия."
        states={[
          "Attached",
          "Просмотр открыт",
          "Просмотр закрыт",
          "Удалено",
          "Восстановлено",
        ]}
        usage="Имя файла читаемо, удаление явно обозначено. Здесь текст примера, не загруженный документ."
        recipe="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4"
      >
        {attachmentVisible ? (
          <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Icon name="file-text" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">
                  project-notes.md
                </p>
                <p className={`mt-1 text-xs ${kit.muted}`}>
                  Markdown · пример вложения
                </p>
              </div>
              <Button
                variant="secondary"
                aria-expanded={previewOpen}
                aria-controls={previewId}
                onClick={() => setPreviewOpen((value) => !value)}
              >
                <Icon name="eye" />
                {previewOpen ? "Скрыть просмотр" : "Просмотр"}
              </Button>
              <Button
                variant="plain"
                className="px-3"
                aria-label="Убрать пример вложения"
                onClick={() => {
                  setAttachmentVisible(false);
                  setPreviewOpen(false);
                }}
              >
                <Icon name="x" />
              </Button>
            </div>
            {previewOpen ? (
              <div
                id={previewId}
                className="mt-4 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-relaxed"
              >
                <p className="font-semibold">Заметки проекта</p>
                <p className={`mt-2 ${kit.muted}`}>
                  Соберите имеющиеся материалы, перечислите открытые вопросы и
                  вместе проверьте следующий черновик.
                </p>
                <p className={`mt-3 text-xs ${kit.muted}`}>
                  Статичный текст примера вложения.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className={`text-sm ${kit.muted}`}>
              Пример вложения убран.
            </p>
            <Button
              variant="secondary"
              onClick={() => setAttachmentVisible(true)}
            >
              Восстановить пример
            </Button>
          </div>
        )}
      </Specimen>
    </div>
  );
}
