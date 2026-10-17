import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component({
  variant = "content-ai-chat-profile-create",
  children,
  data,
  language = "en",
  className,
}: IComponentPropsExtended) {
  return (
    <main
      className={cn(
        "mx-auto max-w-6xl px-4 py-6 sm:px-5",
        data?.className,
        className,
      )}
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
      data-id={data?.id}
    >
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
        <section className="flex flex-col justify-center p-6 sm:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
          <h1 className="text-3xl font-semibold leading-tight">
            {data?.title?.[language] || data?.title?.en || "Start with a name."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Create a project with Brief, Strategy, Brand, Design and Products
            documents. Start with the Brief and add knowledge and files as you
            work.
          </p>
          {children}
        </section>
        <div className="relative hidden min-w-0 md:block">
          <img
            src="/images/ai-chat/singlepagestartup-photography-project-start-v1-square.png"
            alt="A person working on their project at a desk"
            loading="lazy"
            className="h-full min-h-96 w-full rounded-none object-cover"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-default p-5 text-default-foreground">
            <p className="font-semibold">Your files. Your project.</p>
            <p className="mt-2 text-sm leading-6 text-default-foreground/70">
              Describe your business, attach useful files and work with the
              assistant in your project.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
