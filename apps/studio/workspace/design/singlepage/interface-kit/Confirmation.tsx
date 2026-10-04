import { useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button, kit } from "./primitives";

export interface IConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  portalContainer?: HTMLElement | null;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  portalContainer,
}: IConfirmationDialogProps) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <div ref={setPortal}>
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portalContainer ?? portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl"
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
