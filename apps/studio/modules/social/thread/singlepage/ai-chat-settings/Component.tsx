"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import {
  Button,
  Icon,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { TextField } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { type IProjectTopic } from "../../../../../workspace/utils/products/ai-chat-workspace";
export interface IThreadSettingsProps {
  topic: IProjectTopic;
  onSave: (title: string) => void;
  onDelete: () => void;
}
export function Component({ topic, onSave, onDelete }: IThreadSettingsProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTitle(topic.title);
          setConfirmDelete(false);
        }
        setOpen(next);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          variant="plain"
          className="min-h-9 shrink-0 px-2"
          aria-label="Thread settings"
          title="Thread settings"
        >
          <Icon name="gear-six" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sps-graphite/40" />
        <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-xl flex-col overflow-hidden rounded-2xl border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-sps-line p-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Thread settings
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-sps-muted">
                Rename or delete this thread.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="plain"
                className="min-h-9 px-2"
                aria-label="Close thread settings"
              >
                <Icon name="x" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 space-y-6 overflow-y-auto p-5">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!title.trim()) return;
                onSave(title.trim());
                setOpen(false);
              }}
            >
              <TextField
                label="Thread name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={100}
              />
              <Button type="submit" disabled={!title.trim()}>
                <Icon name="floppy-disk" />
                Save changes
              </Button>
            </form>
            <div className="border-t border-sps-line pt-5">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="break-words text-sm leading-6">
                    Delete “{topic.title}” and its messages?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        setOpen(false);
                        onDelete();
                      }}
                    >
                      Delete thread
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" />
                  Delete thread
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
