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
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

interface MessageEditDialogProps {
  form: UseFormReturn<MessageEditFormValues>;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MessageEditFormValues) => Promise<void> | void;
}

export function MessageEditDialog(props: MessageEditDialogProps) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Update the message text and save changes.
          </DialogDescription>
        </DialogHeader>
        <Form {...props.form}>
          <div className="grid w-full gap-4">
            <div className="flex w-full flex-col gap-2" data-color-mode="light">
              <label className="text-sm font-medium">Text</label>
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
              {props.isUpdating ? "Updating..." : "Save changes"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
