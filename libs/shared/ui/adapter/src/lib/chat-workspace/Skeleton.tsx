import { Skeleton } from "@sps/shared-ui-shadcn";
import { ChatWorkspace } from "./index";

function Bar({ className }: { className: string }) {
  return <Skeleton className={`motion-reduce:animate-none ${className}`} />;
}

export function ChatNavigationSkeleton() {
  return (
    <div aria-hidden="true" className="h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Bar className="h-4 w-20" />
        <Bar className="size-8 rounded-lg" />
      </div>
      <div className="space-y-1 p-2">
        {["w-2/3", "w-1/2", "w-3/4", "w-2/3", "w-1/2", "w-3/4"].map(
          (width, index) => (
            <div key={index} className="flex h-16 items-center gap-3 px-2">
              <Bar className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bar className={`h-3 ${width}`} />
                <Bar className="h-2 w-4/5" />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 flex-col justify-center gap-2 border-b border-border px-4">
        <Bar className="h-2 w-14" />
        <Bar className="h-4 w-2/5 max-w-56" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-hidden p-4">
            <Bar className="h-12 w-2/3 rounded-2xl" />
            <Bar className="ml-auto h-10 w-1/2 rounded-2xl" />
          </div>
          <div className="border-t border-border p-4">
            <div className="flex h-32 flex-col justify-between rounded-2xl border border-border p-3">
              <Bar className="h-3 w-2/5" />
              <Bar className="ml-auto h-8 w-20 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="hidden w-[360px] shrink-0 space-y-3 border-l border-border bg-muted p-4 xl:block">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <Bar className="h-3 w-1/3" />
              <Bar className="h-3 w-3/4" />
              <Bar className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatWorkspaceSkeleton({
  language,
  list = false,
}: {
  language: string;
  list?: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={language === "ru" ? "Загрузка чатов" : "Loading chats"}
    >
      <ChatWorkspace
        siteLayout
        navigation={<ChatNavigationSkeleton />}
        navigationClassName={`${list ? "block w-full" : "hidden"} overflow-hidden border-border bg-card p-0 lg:block lg:w-80 lg:border-r`}
      >
        {list ? (
          <div className="hidden flex-1 lg:block" />
        ) : (
          <ChatThreadSkeleton />
        )}
      </ChatWorkspace>
    </div>
  );
}
