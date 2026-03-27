"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/rbac/models/subject/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { randomWordsGenerator } from "@sps/shared-utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import { useEffect, useMemo, useState } from "react";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      slug: props.data?.slug || randomWordsGenerator({ type: "slug" }),
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      updateEntity.mutate({ id: props.data?.id, data });
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
        title: "Identities",
        render: props.subjectsToIdentities,
      },
      {
        id: "subjects-to-roles",
        title: "Roles",
        render: props.subjectsToRoles,
      },
      {
        id: "subjects-to-ecommerce-module-products",
        title: "Products",
        render: props.subjectsToEcommerceModuleProducts,
      },
      {
        id: "subjects-to-ecommerce-module-orders",
        title: "Orders",
        render: props.subjectsToEcommerceModuleOrders,
      },
      {
        id: "subjects-to-notification-module-topics",
        title: "Topics",
        render: props.subjectsToNotificationModuleTopics,
      },
      {
        id: "subjects-to-billing-module-payment-intents",
        title: "Payment intents",
        render: props.subjectsToBillingModulePaymentIntents,
      },
      {
        id: "subjects-to-social-module-profiles",
        title: "Profiles",
        render: props.subjectsToSocialModuleProfiles,
      },
      {
        id: "subjects-to-blog-module-articles",
        title: "Articles",
        render: props.subjectsToBlogModuleArticles,
      },
      {
        id: "subjects-to-actions",
        title: "Actions",
        render: props.subjectsToActions,
      },
      {
        id: "subjects-to-billing-module-currencies",
        title: "Currencies",
        render: props.subjectsToBillingModuleCurrencies,
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
  }, [
    props.subjectsToIdentities,
    props.subjectsToRoles,
    props.subjectsToEcommerceModuleProducts,
    props.subjectsToEcommerceModuleOrders,
    props.subjectsToNotificationModuleTopics,
    props.subjectsToBillingModulePaymentIntents,
    props.subjectsToSocialModuleProfiles,
    props.subjectsToBlogModuleArticles,
    props.subjectsToActions,
    props.subjectsToBillingModuleCurrencies,
  ]);

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
      name="subject"
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
              label="Slug"
              name="slug"
              form={form}
              placeholder="Enter slug"
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
