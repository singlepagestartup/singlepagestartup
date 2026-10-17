"use client";

import { IComponentPropsExtended } from "../interface";
import { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
} from "@sps/shared-ui-shadcn";
import { z } from "zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { useState } from "react";

const formSchema = z.object({
  password: z.string().min(8),
  newPassword: z.string().min(8),
});

export function Component(
  props: IComponentPropsExtended & {
    identity: IIdentity;
  },
) {
  const [isOpen, setIsOpen] = useState(false);

  const updateIdentity = api.identityUpdate({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      newPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await updateIdentity.mutateAsync({
        id: props.data.id,
        identityId: props.identity.id,
        data,
      });
      setIsOpen(false);
      form.reset();
    } catch {
      /* The mutation exposes the error below. */
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        updateIdentity.reset();
        if (!open) form.reset();
      }}
    >
      <DialogTrigger asChild={true}>
        <Button variant="outline" className="w-fit">
          Change password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password.</DialogDescription>
        </DialogHeader>
        {updateIdentity.isError && (
          <p role="alert" className="text-sm text-destructive">
            {updateIdentity.error.message}
          </p>
        )}
        <Form {...form}>
          <div className="w-full flex flex-col gap-3">
            <FormField
              ui="shadcn"
              form={form}
              name="password"
              type="password"
              label="Current password"
              placeholder="Enter current password"
            />
            <FormField
              ui="shadcn"
              type="password"
              label="New password"
              name="newPassword"
              form={form}
              placeholder="Enter new password"
            />

            <Button
              variant="primary"
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateIdentity.isPending}
            >
              {updateIdentity.isPending ? "Updating..." : "Change password"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
