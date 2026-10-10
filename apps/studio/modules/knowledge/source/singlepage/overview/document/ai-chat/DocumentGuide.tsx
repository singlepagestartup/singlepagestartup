"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Icon,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";

export interface IDocumentGuideProps {
  guide: {
    title: string;
    body: string;
    basis?: string;
  } | null;
  onClose: () => void;
  onReturnFocus: () => void;
}

export function DocumentGuide({
  guide,
  onClose,
  onReturnFocus,
}: IDocumentGuideProps) {
  return (
    <Dialog.Root
      open={Boolean(guide)}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sps-graphite/40" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onReturnFocus();
          }}
          className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-xl flex-col overflow-hidden rounded-2xl border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-xl focus:outline-none"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-sps-line p-5">
            <div className="min-w-0">
              <Dialog.Title className="break-words text-xl font-semibold">
                {guide?.title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close document guide"
                className={`${kit.plain} size-9 shrink-0 p-0`}
              >
                <Icon name="x" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto p-5">
            <MarkdownDocument externalLinksNewTab>
              {guide?.body ?? ""}
            </MarkdownDocument>
            {guide?.basis && (
              <details className="mt-6 border-t border-sps-line pt-4">
                <summary
                  className={`min-h-9 cursor-pointer text-sm font-semibold ${kit.focus}`}
                >
                  Method and sources
                </summary>
                <MarkdownDocument externalLinksNewTab>
                  {guide.basis}
                </MarkdownDocument>
              </details>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
