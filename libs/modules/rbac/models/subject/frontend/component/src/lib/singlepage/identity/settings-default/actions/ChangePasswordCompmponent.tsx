"use client";

import { IComponentPropsExtended } from "../interface";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
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
    updateIdentity.mutate({
      id: props.data.id,
      identityId: props.identity.id,
      data,
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setIsOpen(!isOpen);
      }}
    >
      <DialogTrigger asChild={true}>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          Change password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="w-full flex flex-col gap-3">
            <Identity
              isServer={false}
              hostUrl={props.hostUrl}
              variant="form-field-default"
              form={form}
              field="password"
              type="text"
              data={props.identity}
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
