import type { IComponentProps, SubjectMeDeleteProps } from "./interface";
export type { SubjectMeDeleteProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import {
  useState as useStatePresentation,
  useRef,
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  twMerge as mergeButtonClass,
  twMerge as twMerge,
} from "tailwind-merge";
import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { defaultRbacSubject, type RbacSubject } from "../../../../../shared";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
interface IConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  portalContainer?: HTMLElement | null;
}
function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  portalContainer,
}: IConfirmationDialogProps) {
  const [portal, setPortal] = useStatePresentation<HTMLElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <div ref={setPortal}>
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portalContainer ?? portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 font-default text-foreground shadow-xl"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current = document.activeElement as HTMLElement;
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) returnFocus.current.focus();
              else portalContainer?.focus();
            }}
          >
            <AlertDialog.Title className="text-xl font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              className={`mt-3 text-sm leading-6 ${kit.muted}`}
            >
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button ref={cancel} variant="secondary">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function SubjectMeDelete(props?: IComponentProps) {
  const { title, description, actionLabel, subject } = {
    ...defaultSubjectMeDeleteProps,
    ...props,
  };
  const [pendingSubject, setPendingSubject] = useState<RbacSubject | null>(
    null,
  );
  const [result, setResult] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  return (
    <article
      ref={setPortalContainer}
      className="rounded-2xl border border-destructive-border bg-destructive-surface p-6"
      data-ds-block="rbac.subject.me-delete"
      data-ds-layer="singlepage"
      data-subject-id={subject.id}
      data-module="rbac"
      data-model="subject"
      data-variant={props?.variant ?? "me-delete"}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-destructive">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-destructive">
            {description}
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => setPendingSubject(subject)}
          type="button"
        >
          <Trash2 className="h-5 w-5" />
          {actionLabel}
        </Button>
      </div>
      {result ? (
        <p role="status" className="mt-4 text-sm leading-6 text-destructive">
          {result}
        </p>
      ) : null}
      <ConfirmationDialog
        open={pendingSubject !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubject(null);
        }}
        title="Delete account?"
        description={`Confirm deletion of the current account (${pendingSubject?.slug ?? subject.slug}). This preview records the request without deleting any server data.`}
        confirmLabel={actionLabel}
        onConfirm={() => {
          if (!pendingSubject) return;
          setResult(
            `Account deletion requested for ${pendingSubject.slug} in this preview. No server data was changed.`,
          );
          setPendingSubject(null);
        }}
        portalContainer={portalContainer}
      />
    </article>
  );
}
const Trash2 = createIcon("trash");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  muted: "text-muted-foreground",
};
function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonControlProps<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain" | "danger";
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const appearances = {
    primary: "bg-primary text-primary-foreground enabled:hover:brightness-95",
    secondary:
      "border border-border bg-card text-foreground enabled:hover:bg-muted",
    plain: "text-muted-foreground enabled:hover:text-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95",
  };
  return (
    <button
      {...props}
      type={type}
      className={mergeButtonClass(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        appearances[variant],
        className,
      )}
    />
  );
}
export const defaultSubjectMeDeleteProps: SubjectMeDeleteProps = {
  title: "Danger Zone",
  description:
    "This preview shows the account removal action. It does not delete your account.",
  actionLabel: "Delete account",
  subject: defaultRbacSubject,
};
