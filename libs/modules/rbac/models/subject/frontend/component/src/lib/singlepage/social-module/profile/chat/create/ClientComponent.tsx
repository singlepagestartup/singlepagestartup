"use client";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "node_modules/zod/lib";
import { insertSchema as socialModuleChatInsertSchema } from "@sps/social/models/chat/sdk/model";
import { FormField } from "@sps/ui-adapter";

const formSchema = socialModuleChatInsertSchema;

export function Component(props: IComponentPropsExtended) {
  const socialModuleProfileFindByIdChatCreate =
    api.socialModuleProfileFindByIdChatCreate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      title: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    socialModuleProfileFindByIdChatCreate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      data,
    });
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <Form {...form}>
        <FormField
          ui="shadcn"
          type="text"
          label="Title"
          name="title"
          form={form}
          placeholder="Type title"
          className={cn("flex w-full flex-col")}
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Text"
          name="description"
          form={form}
          placeholder="Type text"
          className={cn("flex w-full flex-col")}
        />

        <Button
          variant="primary"
          className="w-fit"
          onClick={form.handleSubmit(onSubmit)}
        >
          Create Chat
        </Button>
      </Form>
    </div>
  );
}
