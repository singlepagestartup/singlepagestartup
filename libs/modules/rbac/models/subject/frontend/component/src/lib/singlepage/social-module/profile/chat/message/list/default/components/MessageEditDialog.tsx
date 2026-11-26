"use client";

import { MessageEditFormValues } from "../schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
} from "@sps/shared-ui-shadcn";
import MDEditor from "@uiw/react-md-editor";
import { Controller, type UseFormReturn } from "react-hook-form";

interface MessageEditDialogProps {
  form: UseFormReturn<MessageEditFormValues>;
  isOpen: boolean;
  isUpdating: boolean;
  language: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MessageEditFormValues) => Promise<void> | void;
}

export function MessageEditDialog(props: MessageEditDialogProps) {
  const ru = props.language === "ru";
  const textLabel = ru ? "Текст сообщения" : "Message text";
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ru ? "Изменить сообщение" : "Edit Message"}
          </DialogTitle>
          <DialogDescription>
            {ru
              ? "Измените текст и сохраните изменения."
              : "Update the message text and save changes."}
          </DialogDescription>
        </DialogHeader>
        <Form {...props.form}>
          <div className="grid w-full gap-4">
            <div className="flex w-full flex-col gap-2" data-color-mode="light">
              <Controller
                name="description"
                control={props.form.control}
                render={({ field }) => {
                  return (
                    <MDEditor
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value ?? "");
                      }}
                      height={200}
                      visibleDragbar={false}
                      textareaProps={{ "aria-label": textLabel }}
                    />
                  );
                }}
              />
            </div>
            <Button
              variant="primary"
              className="w-auto"
              onClick={props.form.handleSubmit(props.onSubmit)}
              disabled={props.isUpdating}
            >
              {props.isUpdating
                ? ru
                  ? "Сохраняем…"
                  : "Updating..."
                : ru
                  ? "Сохранить"
                  : "Save changes"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
