import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ContentPageHeader } from "../content-page-header";
import type { IComponentPropsExtended } from "./interface";

export function Component({
  data,
  isServer,
  language,
  children,
  className,
  variant,
}: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={variant}
      className={cn("w-full min-w-0", className)}
    >
      <ContentPageHeader
        isServer={isServer}
        variant="content-page-header"
        dataSource="props"
        data={data}
        language={language}
      >
        {children ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </ul>
        ) : (
          <p className="mt-8 rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            {language === "ru"
              ? "Сейчас нет доступных услуг."
              : "No services are available right now."}
          </p>
        )}
      </ContentPageHeader>
    </div>
  );
}
