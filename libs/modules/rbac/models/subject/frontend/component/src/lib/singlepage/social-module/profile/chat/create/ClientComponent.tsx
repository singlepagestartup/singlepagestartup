"use client";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Form, Button } from "@sps/shared-ui-shadcn";
import { api, queryClient } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSchema as socialModuleChatInsertSchema } from "@sps/social/models/chat/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { useRouter } from "next/navigation";

const formSchema = socialModuleChatInsertSchema;

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const ru = props.language === "ru";
  const socialModuleChatCreate = api.socialModuleChatCreate({
    id: props.data.id,
    mute: true,
  });
  const error = socialModuleChatCreate.error;
  const accessDenied = error && "status" in error && error.status === 403;
  const errorMessage = accessDenied
    ? ru
      ? "У вас нет доступа к созданию чатов."
      : "You don't have permission to create chats."
    : ru
      ? "Не удалось создать чат. Попробуйте ещё раз."
      : "Couldn't create the chat. Try again.";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      title: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    socialModuleChatCreate.mutate(
      { id: props.data.id, data },
      {
        onSuccess({ socialModuleChat }) {
          void queryClient.invalidateQueries({
            queryKey: [
              `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/chats`,
            ],
          });
          props.onCreate?.();
          router.push(`/${props.language}/social/chats/${socialModuleChat.id}`);
        },
      },
    );
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            ui="shadcn"
            type="text"
            label={ru ? "Название" : "Title"}
            name="title"
            form={form}
          />
          <FormField
            ui="shadcn"
            type="text"
            label={ru ? "Описание" : "Description"}
            name="description"
            form={form}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-fit"
            disabled={socialModuleChatCreate.isPending}
          >
            {ru ? "Создать чат" : "Create chat"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
