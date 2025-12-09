"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import Link from "next/link";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { FormField } from "@sps/ui-adapter";
import { Form, Button } from "@sps/shared-ui-shadcn";

const formSchema = z.object({
  description: z.string().min(1),
  files: z
    .custom<File[]>(
      (v) => Array.isArray(v) && v.every((item) => item instanceof File),
    )
    .or(z.string().array())
    .optional(),
});
const socialModuleActionFormSchema = z.object({
  payload: z.any().optional(),
});

export function Component(props: IComponentPropsExtended) {
  const socialModuleProfileFindByIdChatFindByIdMessageCreate =
    api.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
    });
  const socialModuleProfileFindByIdChatFindByIdActionCreate =
    api.socialModuleProfileFindByIdChatFindByIdActionCreate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const socialModuleActionForm = useForm<
    z.infer<typeof socialModuleActionFormSchema>
  >({
    resolver: zodResolver(socialModuleActionFormSchema),
    defaultValues: {
      payload: {},
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    socialModuleProfileFindByIdChatFindByIdMessageCreate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data: {
        description: data.description,
        files: data.files,
      },
    });
  }

  async function socialModuleActionFormOnSubmit(
    data: z.infer<typeof socialModuleActionFormSchema>,
  ) {
    socialModuleProfileFindByIdChatFindByIdActionCreate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data: {
        payload: data.payload,
      },
    });
  }

  useEffect(() => {
    if (socialModuleProfileFindByIdChatFindByIdMessageCreate.isSuccess) {
      toast.success("Message created successfully");
    }
  }, [socialModuleProfileFindByIdChatFindByIdMessageCreate]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      {props.socialModuleMessages?.map((socialModuleMessage, index) => {
        return (
          <div
            key={index}
            className="p-4 border rounded-xl flex flex-col gap-2"
          >
            <div className="text-xs px-3 py-1 border border-gray-200 text-gray-800 rounded-full">
              <p>{socialModuleMessage.id}</p>
            </div>
            <SocialModuleProfilesToMessages
              isServer={false}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "messageId",
                        method: "eq",
                        value: socialModuleMessage.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) => {
                return data?.map((socialModuleProfilesToMessage, index) => {
                  return (
                    <SocialModuleProfile
                      key={index}
                      isServer={false}
                      variant="find"
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "id",
                                method: "eq",
                                value: socialModuleProfilesToMessage.profileId,
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data }) => {
                        return data?.map((socialModuleProfile, index) => {
                          const href = saveLanguageContext(
                            `/social/profiles/${socialModuleProfile.slug}`,
                            props.language,
                            internationalization.languages,
                          );

                          return (
                            <Link
                              key={index}
                              href={href}
                              className="p-2 border rounded-lg w-fit cursor-pointer"
                            >
                              <p>{socialModuleProfile.slug}</p>
                            </Link>
                          );
                        });
                      }}
                    </SocialModuleProfile>
                  );
                });
              }}
            </SocialModuleProfilesToMessages>

            {socialModuleMessage.sourceSystemId ? (
              <p className="text-xs text-gray-500">
                Source System ID: {socialModuleMessage.sourceSystemId}
              </p>
            ) : null}

            <p>{socialModuleMessage.description}</p>
          </div>
        );
      })}
      <Form {...socialModuleActionForm}>
        <Button
          variant="secondary"
          onClick={socialModuleActionForm.handleSubmit(
            socialModuleActionFormOnSubmit,
          )}
          className="cursor-pointer"
        >
          Create Action
        </Button>
      </Form>
      <Form {...form}>
        <div className="w-full grid gap-4">
          <FormField
            ui="shadcn"
            type="text"
            label="Text"
            name="description"
            form={form}
            placeholder="Type text"
            className={cn("flex w-full flex-col")}
          />
          <div className="w-1/4">
            <FormField
              ui="shadcn"
              type="file"
              label="File"
              name="files"
              multiple={true}
              form={form}
              placeholder="Select files"
            />
          </div>

          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
}
