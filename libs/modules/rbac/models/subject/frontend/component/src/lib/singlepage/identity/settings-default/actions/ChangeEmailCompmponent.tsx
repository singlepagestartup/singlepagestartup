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
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email(),
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
      email: "",
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
          Change email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Email</DialogTitle>
          <DialogDescription>
            Change your account email address.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="w-full flex flex-col gap-3">
            <Identity
              isServer={false}
              variant="form-field-default"
              form={form}
              field="email"
              type="text"
              fill={true}
              data={props.identity}
            />
          </div>
          <Button
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateIdentity.isPending}
          >
            {updateIdentity.isPending ? "Updating..." : "Update Email"}
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
