"use client";
import { type ImgHTMLAttributes as ImgHTMLAttributes } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { type InputHTMLAttributes as InputHTMLAttributes } from "react";
import { useId as useId } from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { useState, type FormEvent } from "react";
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
interface ISquareImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}
function SquareImage({
  alt,
  className,
  loading = "lazy",
  ...props
}: ISquareImageProps) {
  return (
    <img
      alt={alt}
      loading={loading}
      className={twMerge("block aspect-square w-full object-cover", className)}
      {...props}
    />
  );
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
export interface IProfileCreateProps {
  onCreate: (name: string) => void;
  onCancel?: () => void;
}
export function Component({ onCreate, onCancel }: IProfileCreateProps) {
  const [name, setName] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 @[640px]:px-5">
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] @[760px]:grid-cols-2">
        <section className="flex flex-col justify-center p-6 @[640px]:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-[color:var(--workspace-brand-accent)]" />
          <h1 className="text-3xl font-semibold leading-tight">
            Начните с названия
          </h1>
          <p className={`mt-4 text-sm leading-6 ${kit.muted}`}>
            Создайте проект и начните работу в обсуждении продуктов. Добавляйте
            знания и файлы по мере работы.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <TextField
              label="Название проекта"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Над чем вы работаете?"
              required
              autoComplete="off"
              maxLength={100}
            />
            <Button type="submit" disabled={!name.trim()}>
              <Icon name="plus" />
              Создать проект
            </Button>
            {onCancel && (
              <Button variant="plain" onClick={onCancel}>
                К моему проекту
              </Button>
            )}
          </form>
        </section>
        <div className="relative hidden min-w-0 @[760px]:block">
          <SquareImage
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png"
            alt="Человек работает над своим проектом за столом"
            className="h-full min-h-96 w-full rounded-none object-cover"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-[color:var(--workspace-brand-foreground)] p-5 text-white">
            <p className="font-semibold">Ваши файлы и ваш проект</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Опишите продукты, приложите файлы и обсудите проект с помощником.
            </p>
          </div>
        </div>
      </div>
    </main>
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
