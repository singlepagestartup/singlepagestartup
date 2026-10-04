import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import * as SelectPrimitive from "@radix-ui/react-select";

export interface IIconProps {
  name: IconName;
  size?: 20 | 24;
  className?: string;
}

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "plain" | "danger";
}

export interface ICheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}

export interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  options: ISelectOption[];
}

export interface ISpecimenProps {
  id: string;
  title: string;
  description: string;
  states: string[];
  usage: string;
  recipe: string;
  children: ReactNode;
}

export type IconName =
  | "arrow-right"
  | "arrow-down"
  | "caret-down"
  | "arrow-up-right"
  | "file-text"
  | "folder-open"
  | "check"
  | "x"
  | "stack"
  | "globe"
  | "chat-circle"
  | "plus"
  | "pencil-simple"
  | "eye"
  | "upload-simple"
  | "gear-six"
  | "trash"
  | "question";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50";

export const kit = {
  button: `${buttonBase} bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] enabled:hover:bg-[var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[var(--workspace-brand-muted)] enabled:hover:text-[var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-base text-[var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[var(--workspace-brand-muted)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[var(--workspace-brand-background)] disabled:text-[var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[var(--workspace-brand-background)] aria-invalid:border-[var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-on-accent)] checked:border-transparent checked:bg-[var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5",
  muted: "text-[var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[var(--workspace-brand-foreground)]",
  focus,
};

export const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-[var(--workspace-brand-focus)]/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-[var(--workspace-brand-muted)]",
  content:
    "z-[60] max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};

// Official Phosphor Regular 2.1.1 files; their paths are retained unchanged.
// Source and MIT license live beside the curated SVG assets.
const iconSources = import.meta.glob<string>(
  "../../../assets/singlepage/icons/phosphor/*.svg",
  { eager: true, import: "default", query: "?raw" },
);

export function Icon({ name, size = 20, className }: IIconProps) {
  const source =
    iconSources[`../../../assets/singlepage/icons/phosphor/${name}.svg`];
  const geometry = source
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  if (!geometry) throw new Error(`Missing registered Phosphor icon: ${name}`);

  return (
    <svg
      className={twMerge(
        size === 24 ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0",
        className,
      )}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, IButtonProps>(
  function Button(
    { variant = "primary", type = "button", className, ...props },
    ref,
  ) {
    const variants = {
      primary: kit.button,
      secondary: kit.secondary,
      plain: kit.plain,
      danger: kit.danger,
    };

    return (
      <button
        ref={ref}
        type={type}
        className={twMerge(variants[variant], className)}
        {...props}
      />
    );
  },
);

export const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center has-[:disabled]:opacity-50">
        <input
          ref={ref}
          type="checkbox"
          className={twMerge(kit.checkbox, kit.focus, className)}
          {...props}
        />
        <Icon
          name="check"
          className="pointer-events-none absolute h-3.5 w-3.5 text-[var(--workspace-brand-on-accent)] opacity-0 peer-checked:opacity-100 peer-indeterminate:hidden"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute hidden h-0.5 w-2.5 rounded-full bg-[var(--workspace-brand-on-accent)] peer-indeterminate:block"
        />
      </span>
    );
  },
);

// shadcn Select composition, themed with workspace tokens and Phosphor icons.
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
      ...props
    },
    ref,
  ) {
    const [portal, setPortal] = useState<HTMLDivElement | null>(null);

    return (
      <div ref={setPortal} className="min-w-0">
        <SelectPrimitive.Root {...props}>
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            className={twMerge(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal container={portal}>
            <SelectPrimitive.Content
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

export function Specimen({
  id,
  title,
  description,
  states,
  usage,
  recipe,
  children,
}: ISpecimenProps) {
  return (
    <article
      data-specimen={id}
      className={`${kit.card} p-5 text-[var(--workspace-brand-foreground)] sm:p-6 md:p-8`}
    >
      <h3 className="text-base font-semibold leading-[26px]">{title}</h3>
      <p className={`mt-2 max-w-3xl text-sm leading-[22px] ${kit.muted}`}>
        {description}
      </p>
      <div className="mt-6 min-w-0">{children}</div>
      <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4 text-xs leading-5">
        <summary
          className={`w-fit cursor-pointer rounded-md font-medium ${kit.focus}`}
        >
          States, usage and class recipe
        </summary>
        <dl className="mt-4 grid gap-3">
          <div>
            <dt className="font-semibold">States</dt>
            <dd className={kit.muted}>{states.join(" · ")}</dd>
          </div>
          <div>
            <dt className="font-semibold">Usage</dt>
            <dd className={kit.muted}>{usage}</dd>
          </div>
          <div>
            <dt className="font-semibold">Class recipe</dt>
            <dd className={`whitespace-pre-wrap break-words ${kit.muted}`}>
              {recipe}
            </dd>
          </div>
        </dl>
      </details>
    </article>
  );
}

export interface ISurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "article" | "section" | "figure";
}

export interface ISquareImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}

export function Surface({
  as: Tag = "div",
  className,
  ...props
}: ISurfaceProps) {
  return (
    <Tag
      className={twMerge(
        "min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]",
        className,
      )}
      {...props}
    />
  );
}

export function SquareImage({
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
