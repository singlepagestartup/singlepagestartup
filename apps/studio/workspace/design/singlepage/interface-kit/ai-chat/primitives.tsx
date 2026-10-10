"use client";
import icons from "./icons.json";
import {
  forwardRef,
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
  svgProps?: React.SVGProps<SVGSVGElement>;
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
  "aria-describedby"?: string;
  options: ISelectOption[];
}

export interface ISpecimenProps {
  id: string;
  title: string;
  description: string;
  guidance?: ReactNode;
  states: string[];
  usage: string;
  recipe: string;
  children: ReactNode;
}

export type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "arrow-up-right"
  | "bank"
  | "bell"
  | "book-open"
  | "bookmark-simple"
  | "calendar-blank"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "chart-bar"
  | "chat"
  | "chat-circle"
  | "check"
  | "check-circle"
  | "clock"
  | "code"
  | "confetti"
  | "credit-card"
  | "cube"
  | "currency-circle-dollar"
  | "database"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "file-text"
  | "floppy-disk"
  | "folder-open"
  | "gear-six"
  | "github-logo"
  | "globe"
  | "google-chrome-logo"
  | "hash"
  | "house"
  | "image"
  | "key"
  | "lightning"
  | "link"
  | "link-break"
  | "linkedin-logo"
  | "list"
  | "lock-key"
  | "magnifying-glass"
  | "map-pin"
  | "megaphone"
  | "minus"
  | "monitor"
  | "newspaper"
  | "package"
  | "palette"
  | "paper-plane-tilt"
  | "paperclip"
  | "pencil-simple"
  | "phone"
  | "play"
  | "plus"
  | "push-pin"
  | "question"
  | "robot"
  | "share-network"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "sign-in"
  | "sign-out"
  | "smiley"
  | "squares-four"
  | "stack"
  | "star"
  | "tag"
  | "text-b"
  | "text-italic"
  | "thumbs-up"
  | "trash"
  | "trend-up"
  | "twitter-logo"
  | "upload-simple"
  | "user"
  | "user-circle"
  | "user-plus"
  | "users"
  | "wallet"
  | "warning"
  | "x";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sps-graphite";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export const kit = {
  button: `${buttonBase} bg-sps-green text-sps-graphite enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-sps-line bg-sps-white text-sps-graphite enabled:hover:bg-sps-grey ${focus}`,
  plain: `${buttonBase} text-sps-muted enabled:hover:text-sps-graphite ${focus}`,
  danger: `${buttonBase} border border-sps-danger-line bg-sps-danger-surface text-sps-danger enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-sps-line bg-sps-white px-4 py-2 text-base text-sps-graphite outline-none transition motion-reduce:transition-none placeholder:text-sps-muted focus-visible:border-sps-graphite focus-visible:ring-2 focus-visible:ring-sps-graphite focus-visible:ring-offset-2 focus-visible:ring-offset-sps-white disabled:cursor-not-allowed disabled:bg-sps-grey disabled:text-sps-muted disabled:opacity-60 [&[readonly]]:bg-sps-grey aria-invalid:border-sps-danger aria-invalid:focus-visible:ring-sps-danger",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-sps-line bg-sps-white text-sps-graphite checked:border-transparent checked:bg-sps-green indeterminate:border-transparent indeterminate:bg-sps-green disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-sps-line bg-sps-white p-5",
  muted: "text-sps-muted",
  label: "text-sm font-semibold text-sps-graphite",
  focus,
};

export const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-sps-graphite/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-sps-muted",
  content:
    "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-sps-grey data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};

// Official Phosphor Regular 2.1.1 files; their paths are retained unchanged.
// The original SVG markup is bundled in icons.json with its MIT license.
const iconSources: Record<IconName, string> = icons;

export function Icon({ name, size = 20, className, svgProps }: IIconProps) {
  const source = iconSources[name];
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
      {...svgProps}
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
          className="pointer-events-none absolute h-3.5 w-3.5 text-sps-graphite opacity-0 peer-checked:opacity-100 peer-indeterminate:hidden"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute hidden h-0.5 w-2.5 rounded-full bg-sps-graphite peer-indeterminate:block"
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

export function Specimen({
  id,
  title,
  description,
  guidance,
  states,
  usage,
  recipe,
  children,
}: ISpecimenProps) {
  return (
    <article
      data-specimen={id}
      className={`${kit.card} p-5 text-sps-graphite sm:p-6 md:p-8`}
    >
      <h3 className="text-base font-semibold leading-[26px]">{title}</h3>
      <p className={`mt-2 max-w-3xl text-sm leading-[22px] ${kit.muted}`}>
        {description}
      </p>
      {guidance}
      <div className="mt-6 min-w-0">{children}</div>
      <details className="mt-6 border-t border-sps-line pt-4 text-xs leading-5">
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
        "min-w-0 overflow-hidden rounded-2xl border border-sps-line bg-sps-white",
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
