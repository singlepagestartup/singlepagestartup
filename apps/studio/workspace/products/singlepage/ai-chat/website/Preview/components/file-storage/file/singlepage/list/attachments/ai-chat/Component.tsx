"use client";
import Glyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
function WebsiteBuilderModuleFeature({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  variant?: string;
  name: keyof typeof Glyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = Glyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}

import {
  forwardRef,
  type ReactNode,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import { Component as AttachmentFile } from "../../../attachment/ai-chat";
import { useFiles } from "./Files";
import { readProjectFiles, AI_CHAT_ATTACHMENT_ACCEPT } from "./utils";
interface IFeedbackProps {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}
function Feedback({ children, kind = "success" }: IFeedbackProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-destructive-border bg-destructive-surface text-destructive" : "border-border bg-muted"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={kind === "success" ? "text-foreground" : ""}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
}
function Icon(props: {
  name: keyof typeof Glyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <WebsiteBuilderModuleFeature {...props} variant="icon" />;
}

export interface ISectionAssetsProps {
  variant?: string;
  section: string;
  fileIds: string[];
  onAttach: (ids: string[]) => void;
  onRemove: (fileId: string) => void | Promise<void>;
  initialExpanded?: boolean;
  pendingFileId?: string | null;
  errorMessage?: string;
  statusMessage?: string;
}
interface IFileAttachmentProps {
  id: string;
  onRemove: (id: string) => void;
  pending: boolean;
}
export function Component({
  variant = "list-attachments-ai-chat",
  section,
  fileIds,
  onAttach,
  onRemove,
  initialExpanded = false,
  pendingFileId = null,
  errorMessage = "",
  statusMessage = "",
}: ISectionAssetsProps) {
  const { files: sources, register } = useFiles();
  const linked = fileIds.filter((id) => sources.some((file) => file.id === id));
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState("");
  const [expanded, setExpanded] = useState(initialExpanded);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removal = useRef(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const available = sources.filter((source) => !linked.includes(source.id));
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const remove = useCallback(
    async (fileId: string) => {
      if (removal.current || pendingFileId) {
        setError("Дождитесь завершения операции с файлом.");
        return;
      }
      removal.current = true;
      setRemovingId(fileId);
      setError("");
      try {
        await onRemove(fileId);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Не удалось удалить файл.",
        );
      } finally {
        removal.current = false;
        if (mounted.current) setRemovingId(null);
      }
    },
    [onRemove, pendingFileId],
  );
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setError("");
    try {
      const uploaded = await readProjectFiles(files, id);
      if (mounted.current) {
        register(uploaded);
        onAttach(uploaded.map((file) => file.id));
      } else
        uploaded.forEach(
          (file) => file.fileUrl && URL.revokeObjectURL(file.fileUrl),
        );
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error ? cause.message : "Не удалось добавить файлы.",
        );
    } finally {
      if (mounted.current) setReading(false);
    }
  }
  return (
    <section
      aria-label={`${section} — файлы`}
      className="mt-3 space-y-3 border-t border-border pt-3"
      data-module="file-storage"
      data-model="file"
      data-variant={variant}
    >
      <p className={`text-xs ${kit.muted}`}>Файлы · {linked.length}</p>
      {errorMessage && (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage}
        </p>
      )}
      {statusMessage && (
        <p role="status" className="text-xs text-muted-foreground">
          {statusMessage}
        </p>
      )}
      <ul
        aria-label="Файлы базы знаний"
        className="grid min-w-0 grid-cols-2 gap-2"
      >
        {(expanded ? linked : linked.slice(0, 2)).map((id) => (
          <FileAttachment
            key={id}
            id={id}
            pending={id === (pendingFileId ?? removingId)}
            onRemove={remove}
          />
        ))}
      </ul>
      {linked.length > 2 && (
        <button
          type="button"
          aria-expanded={expanded}
          className="min-h-9 w-full rounded-lg border border-border px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Свернуть" : "Показать ещё"}
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="plain"
          className="min-h-9 px-0 text-xs"
          disabled={reading}
          onClick={() => input.current?.click()}
        >
          <Icon name="upload-simple" className="size-4" />
          {reading ? "Добавляем файлы…" : "Загрузить файлы"}
        </Button>
        <input
          ref={input}
          aria-label={`Загрузить файлы для раздела ${section}`}
          className="sr-only"
          type="file"
          accept={AI_CHAT_ATTACHMENT_ACCEPT}
          multiple
          disabled={reading}
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
        {available.length > 0 && (
          <details className="text-xs">
            <summary
              className={`inline-flex min-h-9 cursor-pointer items-center gap-2 ${kit.focus}`}
            >
              <Icon name="paperclip" className="size-4" />
              Добавить файл
            </summary>
            <div className="mt-2 grid gap-2">
              <Select
                aria-label={`Файл проекта для раздела ${section}`}
                value={selected}
                onValueChange={setSelected}
                placeholder="Выберите файл проекта"
                options={available.map((file) => ({
                  value: file.id,
                  label: file.name,
                }))}
                className="min-h-9 text-xs"
              />
              <Button
                variant="secondary"
                className="min-h-9 text-xs"
                disabled={!available.some((file) => file.id === selected)}
                onClick={() => {
                  const file = available.find((file) => file.id === selected);
                  if (file) onAttach([file.id]);
                  setSelected("");
                }}
              >
                Прикрепить к разделу
              </Button>
            </div>
          </details>
        )}
      </div>
      {error && <Feedback kind="error">{error}</Feedback>}
    </section>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  focus: focus,
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-foreground/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-muted-foreground",
  content:
    "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-card font-default text-foreground shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};
// shadcn Select composition, themed with module tokens and Phosphor icons.
// https://ui.shadcn.com/docs/components/radix/select
export const Select = forwardRef<HTMLButtonElement, ISelectProps>(
  function Select(
    {
      id,
      className,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    return (
      <div className="min-w-0">
        <SelectPrimitive.Root {...props}>
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={twMerge(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {/* Keep fixed positioning outside CSS containers while retaining the project theme. */}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-sps-theme="singlepage"
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={picker.content}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" className="rotate-180" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={picker.item}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Icon name="check" className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  },
);
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const FileAttachment = memo(function FileAttachment({
  id,
  onRemove,
  pending,
}: IFileAttachmentProps) {
  const { files } = useFiles();
  const file = files.find((record) => record.id === id);
  const remove = useCallback(() => onRemove(id), [onRemove, id]);
  if (!file) return null;
  return (
    <li className="relative min-w-0" aria-label={`Вложение ${file.name}`}>
      <AttachmentFile variant="attachment-ai-chat" file={file} />
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Удалить ${file.name} из знаний`}
        className="absolute right-1 top-1 z-10 grid size-7 place-items-center rounded-full bg-foreground text-background hover:opacity-80 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <Icon name="x" className="size-4" />
      </button>
      {pending && (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          Удаляем…
        </p>
      )}
    </li>
  );
});
