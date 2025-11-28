"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "node_modules/zod/lib";
import { insertSchema as socialModuleChatInsertSchema } from "@sps/social/models/chat/sdk/model";

const formSchema = socialModuleChatInsertSchema;

export function Component(props: IComponentPropsExtended) {
  const socialModuleProfileFindByIdChatFindByIdDelete =
    api.socialModuleProfileFindByIdChatFindByIdDelete({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChatId,
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    socialModuleProfileFindByIdChatFindByIdDelete.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChatId,
    });
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full", props.className)}
    >
      <Form {...form}>
        <Button
          variant="destructive"
          onClick={form.handleSubmit(onSubmit)}
          className="w-fit"
        >
          Delete
        </Button>
      </Form>
    </div>
  );
}
