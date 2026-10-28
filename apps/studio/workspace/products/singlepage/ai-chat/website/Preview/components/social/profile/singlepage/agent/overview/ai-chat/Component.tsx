"use client";
import {
  forwardRef as forwardRef,
  type InputHTMLAttributes as InputHTMLAttributes,
  useId as useId,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
  type FormEvent,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  twMerge as twMerge,
  twMerge as twMergePresentation,
} from "tailwind-merge";

import Markdown from "markdown-to-jsx";

import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";

import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { Component as SocialModuleSkill } from "../../../../../skill/index";
import * as Dialog from "@radix-ui/react-dialog";

import { AI_CHAT_AGENTS, type IProjectAgent } from "./resolver";
import { Component as ProjectAgentAvatar } from "../../avatar/ai-chat/index";
import { knowledgeSkill } from "../../../../../skill/singlepage/overview/ai-chat/index";
interface ITextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: ITextFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kit.label}`}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${kit.field} ${className}`}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-[color:var(--workspace-brand-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
function MarkdownDocument({
  children,
  hideTitle = false,
  baseUrl,
  resolveLink,
  externalLinksNewTab = false,
  disableRawHTML = false,
  className,
}: {
  children: string;
  hideTitle?: boolean;
  baseUrl?: string;
  resolveLink?: (url: string) =>
    | string
    | {
        href: string;
        target: "_top";
      };
  externalLinksNewTab?: boolean;
  disableRawHTML?: boolean;
  className?: string;
}) {
  const assetUrl = (value: string = "") => {
    if (!baseUrl || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, `https://studio.invalid${baseUrl}`);
    return url.pathname + url.search + url.hash;
  };
  return (
    <div
      className={twMergePresentation(
        "min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[color:var(--workspace-brand-background)] [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-[color:var(--workspace-brand-muted)] [&_a]:text-[color:var(--workspace-brand-muted)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[color:var(--workspace-brand-line)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[color:var(--workspace-brand-background)] [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-[color:var(--workspace-brand-foreground)] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[color:var(--workspace-brand-foreground)] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-[color:var(--workspace-brand-foreground)] [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-[color:var(--workspace-brand-line)] [&_td]:p-2 [&_th]:border [&_th]:border-[color:var(--workspace-brand-line)] [&_th]:bg-[color:var(--workspace-brand-background)] [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <Markdown
        options={{
          disableParsingRawHTML: disableRawHTML,
          ...(baseUrl || externalLinksNewTab
            ? {
                overrides: {
                  img: {
                    component: ({
                      src,
                      alt,
                      ...props
                    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                      <img {...props} src={assetUrl(src)} alt={alt ?? ""} />
                    ),
                  },
                  a: {
                    component: ({
                      href,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const resolved =
                        resolveLink?.(assetUrl(href)) ?? assetUrl(href);
                      return (
                        <a
                          {...props}
                          {...(typeof resolved === "string"
                            ? { href: resolved }
                            : resolved)}
                          {...(externalLinksNewTab &&
                          /^https?:\/\//i.test(href ?? "")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        />
                      );
                    },
                  },
                },
              }
            : {}),
        }}
      >
        {hideTitle ? children.replace(/^# [^\n]+\n/, "") : children}
      </Markdown>
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
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IAgentProfileProps {
  agent: IProjectAgent | null;
  onClose: () => void;
}
export interface IAgentPickerProps {
  agent: IProjectAgent | null;
  agents: IProjectAgent[];
  onChange: (agent: IProjectAgent | null) => void;
  onSave: (agent: IProjectAgent) => void;
}
export function Component({ agent, onClose }: IAgentProfileProps) {
  return (
    <Dialog.Root
      open={Boolean(agent)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color:var(--workspace-brand-foreground)]/40" />
        <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-xl focus:outline-none">
          <div className="shrink-0 border-b border-[color:var(--workspace-brand-line)] p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--workspace-brand-accent)]">
                <Icon name="robot" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-semibold">
                  {agent?.name}
                </Dialog.Title>
                <p className="mt-1 text-xs text-[color:var(--workspace-brand-muted)]">
                  {agent?.custom ? "Ваш помощник" : "Готовый помощник"}
                </p>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="plain"
                  className="min-h-9 px-2"
                  aria-label="Закрыть профиль помощника"
                >
                  <Icon name="x" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-4 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
              {agent?.description}
            </Dialog.Description>
          </div>
          <div className="min-h-0 overflow-y-auto p-5">
            {agent?.id === knowledgeAgent.id ? (
              <SocialModuleSkill variant="overview-ai-chat" />
            ) : (
              <MarkdownDocument hideTitle>{agent?.role ?? ""}</MarkdownDocument>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ProjectAgentPicker({
  agent,
  agents,
  onChange,
  onSave,
}: IAgentPickerProps) {
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<IProjectAgent | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const available = [...AI_CHAT_AGENTS, ...agents];
  function openEditor(value: IProjectAgent | null) {
    setDraft(value?.custom ? value : null);
    setName(
      value ? (value.custom ? value.name : `${value.name} — custom`) : "",
    );
    setDescription(value?.description ?? "");
    setRole(value?.role ?? "");
    setEditing(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!name.trim() || !description.trim() || !role.trim()) return;
    const next: IProjectAgent = {
      id: draft?.id ?? `custom-${crypto.randomUUID()}`,
      custom: true,
      name: name.trim(),
      description: description.trim(),
      role: role.trim(),
    };
    onSave(next);
    onChange(next);
    setEditing(false);
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            aria-label="Помощник в обсуждении"
            value={agent?.id ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                onChange(null);
                return;
              }
              const next = available.find((item) => item.id === value);
              if (next) onChange(next);
            }}
            options={[
              { value: "none", label: "Без помощника" },
              ...available.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
        </div>
        {agent && <ProjectAgentAvatar agent={agent} onSelect={setProfile} />}
      </div>
      <p className="text-xs leading-5 text-[color:var(--workspace-brand-muted)]">
        {agent?.description ??
          "Используйте выбранную модель с документами без дополнительных инструкций помощника."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="plain"
          className="min-h-9 px-2 text-xs"
          onClick={() => openEditor(null)}
        >
          <Icon name="plus" className="size-4" />
          Создать своего помощника
        </Button>
        {agent && (
          <Button
            variant="plain"
            className="min-h-9 px-2 text-xs"
            onClick={() => openEditor(agent)}
          >
            <Icon name="gear-six" className="size-4" />
            {agent.custom ? "Изменить помощника" : "Настроить инструкции"}
          </Button>
        )}
      </div>
      <Component agent={profile} onClose={() => setProfile(null)} />
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[color:var(--workspace-brand-foreground)]/40" />
          <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--workspace-brand-line)] p-5">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {draft ? "Изменить помощника" : "Создать своего помощника"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
                  Опишите задачи помощника, способ работы и ограничения. Знания
                  о проекте доступны в связанных документах.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="plain"
                  className="min-h-9 px-2"
                  aria-label="Закрыть редактор помощника"
                >
                  <Icon name="x" />
                </Button>
              </Dialog.Close>
            </div>
            <form onSubmit={save} className="space-y-5 overflow-y-auto p-5">
              <TextField
                label="Имя помощника"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
              />
              <label className="block">
                <span className={`${kit.label} mb-2 block`}>Описание</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={3}
                  className={kit.field}
                />
              </label>
              <label className="block">
                <span className={`${kit.label} mb-2 block`}>Role</span>
                <textarea
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  required
                  rows={16}
                  className={`${kit.field} font-mono`}
                  placeholder="Опишите задачи, способ работы, ограничения и ожидаемый результат."
                />
              </label>
              <Button
                type="submit"
                disabled={!name.trim() || !description.trim() || !role.trim()}
              >
                <Icon name="floppy-disk" />
                Сохранить помощника
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-[color:var(--workspace-brand-foreground)]/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-[color:var(--workspace-brand-muted)]",
  content:
    "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[color:var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
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
              data-workspace-projection="singlepage"
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
export const knowledgeAgent: IProjectAgent = {
  id: "knowledge-assistant",
  name: "Помощник по документам",
  description: "Работает со знаниями и файлами проекта.",
  role: knowledgeSkill.description,
};
