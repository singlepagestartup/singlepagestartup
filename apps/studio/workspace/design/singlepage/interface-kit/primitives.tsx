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
import arrowDownSvg from "../../../assets/singlepage/icons/phosphor/arrow-down.svg?raw";
import arrowLeftSvg from "../../../assets/singlepage/icons/phosphor/arrow-left.svg?raw";
import arrowRightSvg from "../../../assets/singlepage/icons/phosphor/arrow-right.svg?raw";
import arrowSquareOutSvg from "../../../assets/singlepage/icons/phosphor/arrow-square-out.svg?raw";
import arrowUpRightSvg from "../../../assets/singlepage/icons/phosphor/arrow-up-right.svg?raw";
import bankSvg from "../../../assets/singlepage/icons/phosphor/bank.svg?raw";
import bellSvg from "../../../assets/singlepage/icons/phosphor/bell.svg?raw";
import bookOpenSvg from "../../../assets/singlepage/icons/phosphor/book-open.svg?raw";
import bookmarkSimpleSvg from "../../../assets/singlepage/icons/phosphor/bookmark-simple.svg?raw";
import calendarBlankSvg from "../../../assets/singlepage/icons/phosphor/calendar-blank.svg?raw";
import caretDownSvg from "../../../assets/singlepage/icons/phosphor/caret-down.svg?raw";
import caretLeftSvg from "../../../assets/singlepage/icons/phosphor/caret-left.svg?raw";
import caretRightSvg from "../../../assets/singlepage/icons/phosphor/caret-right.svg?raw";
import chartBarSvg from "../../../assets/singlepage/icons/phosphor/chart-bar.svg?raw";
import chatSvg from "../../../assets/singlepage/icons/phosphor/chat.svg?raw";
import chatCircleSvg from "../../../assets/singlepage/icons/phosphor/chat-circle.svg?raw";
import checkSvg from "../../../assets/singlepage/icons/phosphor/check.svg?raw";
import checkCircleSvg from "../../../assets/singlepage/icons/phosphor/check-circle.svg?raw";
import clockSvg from "../../../assets/singlepage/icons/phosphor/clock.svg?raw";
import codeSvg from "../../../assets/singlepage/icons/phosphor/code.svg?raw";
import confettiSvg from "../../../assets/singlepage/icons/phosphor/confetti.svg?raw";
import creditCardSvg from "../../../assets/singlepage/icons/phosphor/credit-card.svg?raw";
import cubeSvg from "../../../assets/singlepage/icons/phosphor/cube.svg?raw";
import currencyCircleDollarSvg from "../../../assets/singlepage/icons/phosphor/currency-circle-dollar.svg?raw";
import databaseSvg from "../../../assets/singlepage/icons/phosphor/database.svg?raw";
import envelopeSvg from "../../../assets/singlepage/icons/phosphor/envelope.svg?raw";
import eyeSvg from "../../../assets/singlepage/icons/phosphor/eye.svg?raw";
import eyeSlashSvg from "../../../assets/singlepage/icons/phosphor/eye-slash.svg?raw";
import fileTextSvg from "../../../assets/singlepage/icons/phosphor/file-text.svg?raw";
import floppyDiskSvg from "../../../assets/singlepage/icons/phosphor/floppy-disk.svg?raw";
import folderOpenSvg from "../../../assets/singlepage/icons/phosphor/folder-open.svg?raw";
import gearSixSvg from "../../../assets/singlepage/icons/phosphor/gear-six.svg?raw";
import githubLogoSvg from "../../../assets/singlepage/icons/phosphor/github-logo.svg?raw";
import globeSvg from "../../../assets/singlepage/icons/phosphor/globe.svg?raw";
import googleChromeLogoSvg from "../../../assets/singlepage/icons/phosphor/google-chrome-logo.svg?raw";
import hashSvg from "../../../assets/singlepage/icons/phosphor/hash.svg?raw";
import houseSvg from "../../../assets/singlepage/icons/phosphor/house.svg?raw";
import imageSvg from "../../../assets/singlepage/icons/phosphor/image.svg?raw";
import keySvg from "../../../assets/singlepage/icons/phosphor/key.svg?raw";
import lightningSvg from "../../../assets/singlepage/icons/phosphor/lightning.svg?raw";
import linkSvg from "../../../assets/singlepage/icons/phosphor/link.svg?raw";
import linkBreakSvg from "../../../assets/singlepage/icons/phosphor/link-break.svg?raw";
import linkedinLogoSvg from "../../../assets/singlepage/icons/phosphor/linkedin-logo.svg?raw";
import listSvg from "../../../assets/singlepage/icons/phosphor/list.svg?raw";
import lockKeySvg from "../../../assets/singlepage/icons/phosphor/lock-key.svg?raw";
import magnifyingGlassSvg from "../../../assets/singlepage/icons/phosphor/magnifying-glass.svg?raw";
import mapPinSvg from "../../../assets/singlepage/icons/phosphor/map-pin.svg?raw";
import megaphoneSvg from "../../../assets/singlepage/icons/phosphor/megaphone.svg?raw";
import minusSvg from "../../../assets/singlepage/icons/phosphor/minus.svg?raw";
import monitorSvg from "../../../assets/singlepage/icons/phosphor/monitor.svg?raw";
import newspaperSvg from "../../../assets/singlepage/icons/phosphor/newspaper.svg?raw";
import packageSvg from "../../../assets/singlepage/icons/phosphor/package.svg?raw";
import paletteSvg from "../../../assets/singlepage/icons/phosphor/palette.svg?raw";
import paperPlaneTiltSvg from "../../../assets/singlepage/icons/phosphor/paper-plane-tilt.svg?raw";
import paperclipSvg from "../../../assets/singlepage/icons/phosphor/paperclip.svg?raw";
import pencilSimpleSvg from "../../../assets/singlepage/icons/phosphor/pencil-simple.svg?raw";
import phoneSvg from "../../../assets/singlepage/icons/phosphor/phone.svg?raw";
import playSvg from "../../../assets/singlepage/icons/phosphor/play.svg?raw";
import plusSvg from "../../../assets/singlepage/icons/phosphor/plus.svg?raw";
import pushPinSvg from "../../../assets/singlepage/icons/phosphor/push-pin.svg?raw";
import questionSvg from "../../../assets/singlepage/icons/phosphor/question.svg?raw";
import robotSvg from "../../../assets/singlepage/icons/phosphor/robot.svg?raw";
import shareNetworkSvg from "../../../assets/singlepage/icons/phosphor/share-network.svg?raw";
import shieldSvg from "../../../assets/singlepage/icons/phosphor/shield.svg?raw";
import shieldCheckSvg from "../../../assets/singlepage/icons/phosphor/shield-check.svg?raw";
import shoppingCartSvg from "../../../assets/singlepage/icons/phosphor/shopping-cart.svg?raw";
import signInSvg from "../../../assets/singlepage/icons/phosphor/sign-in.svg?raw";
import signOutSvg from "../../../assets/singlepage/icons/phosphor/sign-out.svg?raw";
import smileySvg from "../../../assets/singlepage/icons/phosphor/smiley.svg?raw";
import squaresFourSvg from "../../../assets/singlepage/icons/phosphor/squares-four.svg?raw";
import stackSvg from "../../../assets/singlepage/icons/phosphor/stack.svg?raw";
import starSvg from "../../../assets/singlepage/icons/phosphor/star.svg?raw";
import tagSvg from "../../../assets/singlepage/icons/phosphor/tag.svg?raw";
import textBSvg from "../../../assets/singlepage/icons/phosphor/text-b.svg?raw";
import textItalicSvg from "../../../assets/singlepage/icons/phosphor/text-italic.svg?raw";
import thumbsUpSvg from "../../../assets/singlepage/icons/phosphor/thumbs-up.svg?raw";
import trashSvg from "../../../assets/singlepage/icons/phosphor/trash.svg?raw";
import trendUpSvg from "../../../assets/singlepage/icons/phosphor/trend-up.svg?raw";
import twitterLogoSvg from "../../../assets/singlepage/icons/phosphor/twitter-logo.svg?raw";
import uploadSimpleSvg from "../../../assets/singlepage/icons/phosphor/upload-simple.svg?raw";
import userSvg from "../../../assets/singlepage/icons/phosphor/user.svg?raw";
import userCircleSvg from "../../../assets/singlepage/icons/phosphor/user-circle.svg?raw";
import userPlusSvg from "../../../assets/singlepage/icons/phosphor/user-plus.svg?raw";
import usersSvg from "../../../assets/singlepage/icons/phosphor/users.svg?raw";
import walletSvg from "../../../assets/singlepage/icons/phosphor/wallet.svg?raw";
import warningSvg from "../../../assets/singlepage/icons/phosphor/warning.svg?raw";
import xSvg from "../../../assets/singlepage/icons/phosphor/x.svg?raw";

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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

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
const iconSources: Record<IconName, string> = {
  "arrow-down": arrowDownSvg,
  "arrow-left": arrowLeftSvg,
  "arrow-right": arrowRightSvg,
  "arrow-square-out": arrowSquareOutSvg,
  "arrow-up-right": arrowUpRightSvg,
  bank: bankSvg,
  bell: bellSvg,
  "book-open": bookOpenSvg,
  "bookmark-simple": bookmarkSimpleSvg,
  "calendar-blank": calendarBlankSvg,
  "caret-down": caretDownSvg,
  "caret-left": caretLeftSvg,
  "caret-right": caretRightSvg,
  "chart-bar": chartBarSvg,
  chat: chatSvg,
  "chat-circle": chatCircleSvg,
  check: checkSvg,
  "check-circle": checkCircleSvg,
  clock: clockSvg,
  code: codeSvg,
  confetti: confettiSvg,
  "credit-card": creditCardSvg,
  cube: cubeSvg,
  "currency-circle-dollar": currencyCircleDollarSvg,
  database: databaseSvg,
  envelope: envelopeSvg,
  eye: eyeSvg,
  "eye-slash": eyeSlashSvg,
  "file-text": fileTextSvg,
  "floppy-disk": floppyDiskSvg,
  "folder-open": folderOpenSvg,
  "gear-six": gearSixSvg,
  "github-logo": githubLogoSvg,
  globe: globeSvg,
  "google-chrome-logo": googleChromeLogoSvg,
  hash: hashSvg,
  house: houseSvg,
  image: imageSvg,
  key: keySvg,
  lightning: lightningSvg,
  link: linkSvg,
  "link-break": linkBreakSvg,
  "linkedin-logo": linkedinLogoSvg,
  list: listSvg,
  "lock-key": lockKeySvg,
  "magnifying-glass": magnifyingGlassSvg,
  "map-pin": mapPinSvg,
  megaphone: megaphoneSvg,
  minus: minusSvg,
  monitor: monitorSvg,
  newspaper: newspaperSvg,
  package: packageSvg,
  palette: paletteSvg,
  "paper-plane-tilt": paperPlaneTiltSvg,
  paperclip: paperclipSvg,
  "pencil-simple": pencilSimpleSvg,
  phone: phoneSvg,
  play: playSvg,
  plus: plusSvg,
  "push-pin": pushPinSvg,
  question: questionSvg,
  robot: robotSvg,
  "share-network": shareNetworkSvg,
  shield: shieldSvg,
  "shield-check": shieldCheckSvg,
  "shopping-cart": shoppingCartSvg,
  "sign-in": signInSvg,
  "sign-out": signOutSvg,
  smiley: smileySvg,
  "squares-four": squaresFourSvg,
  stack: stackSvg,
  star: starSvg,
  tag: tagSvg,
  "text-b": textBSvg,
  "text-italic": textItalicSvg,
  "thumbs-up": thumbsUpSvg,
  trash: trashSvg,
  "trend-up": trendUpSvg,
  "twitter-logo": twitterLogoSvg,
  "upload-simple": uploadSimpleSvg,
  user: userSvg,
  "user-circle": userCircleSvg,
  "user-plus": userPlusSvg,
  users: usersSvg,
  wallet: walletSvg,
  warning: warningSvg,
  x: xSvg,
};

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
  guidance,
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
      {guidance}
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
