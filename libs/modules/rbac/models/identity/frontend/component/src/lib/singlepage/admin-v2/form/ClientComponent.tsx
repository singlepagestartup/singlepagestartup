"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/rbac/models/identity/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  providers,
  variants,
  insertSchema,
} from "@sps/rbac/models/identity/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * The password is never part of the model form (issue #270). That form posts
 * the whole model back and the generic update path stores what it is given
 * without hashing, so a save would write the raw value — or an empty string
 * when the field was left untouched — and lock the account out. Editing a
 * password goes through the change-password route, which verifies the current
 * one and hashes the replacement with the identity's own salt.
 */
const changePasswordSchema = z
  .object({
    password: z.string().min(1, "Enter the current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    newPasswordConfirmation: z.string().min(1, "Repeat the new password"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "The new passwords do not match",
    path: ["newPasswordConfirmation"],
  });

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const changePassword = api.changePassword({ id: props.data?.id || "" });

  const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      newPassword: "",
      newPasswordConfirmation: "",
    },
  });

  async function onChangePassword(data: z.infer<typeof changePasswordSchema>) {
    if (!props.data?.id) {
      return;
    }

    try {
      await changePassword.mutateAsync({
        id: props.data.id,
        data: {
          password: data.password,
          newPassword: data.newPassword,
        },
      });

      changePasswordForm.reset();
      toast.success("Password updated");
    } catch (error: any) {
      toast.error(error?.message || "Could not update the password");
    }
  }

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      account: props.data?.account || "",
      email: props.data?.email || "",
      provider: props.data?.provider || "email_and_password",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      /**
       * The password is set through the change-password route, never through
       * the model update (issue #270): this path does not hash, so any value
       * sent here would be stored verbatim and lock the account out.
       */
      const { password, ...rest } = data;

      updateEntity.mutate({ id: props.data?.id, data: rest as typeof data });
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  const relationSections = useMemo(() => {
    return [
      {
        id: "subjects-to-identities",
        title: "Subjects",
        render: props.subjectsToIdentities,
      },
    ].filter(
      (
        section,
      ): section is {
        id: string;
        title: string;
        render: NonNullable<typeof section.render>;
      } => Boolean(section.render),
    );
  }, [props.subjectsToIdentities]);

  const [activeMainTab, setActiveMainTab] = useState<"details" | "relations">(
    "details",
  );
  const [activeRelationTab, setActiveRelationTab] = useState(
    relationSections[0]?.id || "",
  );

  useEffect(() => {
    if (!relationSections.length) {
      setActiveRelationTab("");
      if (activeMainTab === "relations") {
        setActiveMainTab("details");
      }
      return;
    }

    if (!relationSections.some((section) => section.id === activeRelationTab)) {
      setActiveRelationTab(relationSections[0].id);
    }
  }, [relationSections, activeRelationTab, activeMainTab]);

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      isServer={false}
      module="rbac"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="identity"
      status={status}
    >
      <Tabs
        value={activeMainTab}
        onValueChange={(value) => {
          setActiveMainTab(value as "details" | "relations");
        }}
        className="-mt-6"
      >
        <div className="-mx-6 border-b border-border bg-slate-50 px-6 py-4">
          <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
            <TabsTrigger
              value="details"
              className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="relations"
              className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
              disabled={!relationSections.length}
            >
              Relations
              <span className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-sm">
                {relationSections.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-0 pt-6">
          <div className="flex flex-col gap-6">
            <FormField
              ui="shadcn"
              type="text"
              label="Account"
              name="account"
              form={form}
              placeholder="Enter account"
            />

            <FormField
              ui="shadcn"
              type="text"
              label="Email"
              name="email"
              form={form}
              placeholder="Enter email"
            />

            {props.data?.id ? (
              <div className="flex flex-col gap-6 rounded-xl border border-slate-300 bg-slate-50 p-5">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    The stored password is never shown. Changing it requires the
                    current password.
                  </p>
                </div>

                <FormField
                  ui="shadcn"
                  type="password"
                  label="Current password"
                  name="password"
                  form={changePasswordForm}
                  placeholder="Enter the current password"
                />

                <FormField
                  ui="shadcn"
                  type="password"
                  label="New password"
                  name="newPassword"
                  form={changePasswordForm}
                  placeholder="Enter the new password"
                />

                <FormField
                  ui="shadcn"
                  type="password"
                  label="Confirm new password"
                  name="newPasswordConfirmation"
                  form={changePasswordForm}
                  placeholder="Repeat the new password"
                />

                <Button
                  type="button"
                  className="w-fit"
                  disabled={changePassword.isPending}
                  onClick={changePasswordForm.handleSubmit(onChangePassword)}
                >
                  {changePassword.isPending ? "Updating..." : "Update password"}
                </Button>
              </div>
            ) : (
              <FormField
                ui="shadcn"
                type="password"
                label="Password"
                name="password"
                form={form}
                placeholder="Enter password"
              />
            )}

            <FormField
              ui="shadcn"
              type="select"
              label="Provider"
              name="provider"
              form={form}
              placeholder="Select provider"
              options={providers.map((provider) => [provider, provider])}
            />

            <FormField
              ui="shadcn"
              type="select"
              label="Variant"
              name="variant"
              form={form}
              placeholder="Select variant"
              options={variants.map((variant) => [variant, variant])}
            />
          </div>
        </TabsContent>

        <TabsContent value="relations" className="mt-0 pt-6">
          {relationSections.length ? (
            <Tabs
              value={activeRelationTab}
              onValueChange={(value) => {
                setActiveRelationTab(value);
              }}
              className="space-y-4"
            >
              <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
                {relationSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
                  >
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {relationSections.map((section) => (
                <TabsContent
                  key={section.id}
                  value={section.id}
                  className="mt-0"
                >
                  <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
                    {section.render({
                      data: props.data,
                      isServer: false,
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-muted-foreground">
              No relations configured for this model.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ParentAdminForm>
  );
}
