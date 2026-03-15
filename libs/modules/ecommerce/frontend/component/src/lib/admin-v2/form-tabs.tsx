"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sps/shared-ui-shadcn";
import { type ReactNode, useEffect, useState } from "react";

export interface IRelationSection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface IModelFormTabsProps {
  details: ReactNode;
  relationSections: IRelationSection[];
  emptyStateText?: string;
}

export function ModelFormTabs(props: IModelFormTabsProps) {
  const [activeMainTab, setActiveMainTab] = useState<"details" | "relations">(
    "details",
  );
  const [activeRelationTab, setActiveRelationTab] = useState(
    props.relationSections[0]?.id || "",
  );

  useEffect(() => {
    if (!props.relationSections.length) {
      setActiveRelationTab("");
      if (activeMainTab === "relations") {
        setActiveMainTab("details");
      }
      return;
    }

    if (
      !props.relationSections.some(
        (section) => section.id === activeRelationTab,
      )
    ) {
      setActiveRelationTab(props.relationSections[0].id);
    }
  }, [props.relationSections, activeRelationTab, activeMainTab]);

  return (
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
            disabled={!props.relationSections.length}
          >
            Relations
            <span className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-sm">
              {props.relationSections.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="details" className="mt-0 pt-6">
        {props.details}
      </TabsContent>

      <TabsContent value="relations" className="mt-0 pt-6">
        {props.relationSections.length ? (
          <Tabs
            value={activeRelationTab}
            onValueChange={(value) => {
              setActiveRelationTab(value);
            }}
            className="space-y-4"
          >
            <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
              {props.relationSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="w-full rounded px-4 py-2 text-base data-[state=active]:bg-white"
                >
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {props.relationSections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-0">
                <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
                  {section.content}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-muted-foreground">
            {props.emptyStateText || "No relations configured for this model."}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
