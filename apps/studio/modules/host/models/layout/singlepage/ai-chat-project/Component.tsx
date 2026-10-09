"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
export interface IProjectLayoutProps {
  sidebar: (mobile: boolean) => ReactNode;
  children: (navigation: ReactNode) => ReactNode;
}
export function Component({ sidebar, children }: IProjectLayoutProps) {
  const id = useId();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const frame = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const mobile = entry.contentRect.width < 760;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const toggle = isMobile ? (
    <Dialog.Trigger asChild>
      <Button
        variant="plain"
        className="min-h-9 shrink-0 px-2"
        aria-label="Show sidebar"
      >
        <Icon name="list" />
      </Button>
    </Dialog.Trigger>
  ) : (
    <Button
      variant="plain"
      className="min-h-9 shrink-0 px-2"
      aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      aria-expanded={sidebarOpen}
      aria-controls={`${id}-sidebar`}
      onClick={() => setSidebarOpen((current) => !current)}
    >
      <Icon name="list" />
    </Button>
  );
  return (
    <Dialog.Root
      modal={false}
      open={isMobile && mobileOpen}
      onOpenChange={setMobileOpen}
    >
      <main
        ref={frame}
        className="@container/workspace mx-auto max-w-[1440px] px-4 py-6 @[640px]:px-5"
      >
        <div
          id="documents"
          data-ds-block="host.layout.ai-chat-project"
          className={`grid min-w-0 overflow-clip @[760px]:overflow-hidden @[760px]:h-160 rounded-2xl border border-sps-line bg-sps-white ${sidebarOpen ? "@[760px]:grid-cols-[210px_minmax(0,1fr)]" : "grid-cols-1"}`}
        >
          {isMobile ? (
            <Dialog.Portal>
              <button
                type="button"
                aria-label="Close project sidebar"
                onClick={() => setMobileOpen(false)}
                className="fixed inset-x-0 bottom-0 top-18 z-20 bg-black/40"
              />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed bottom-0 left-0 top-18 z-30 w-80 max-w-[calc(100vw-3rem)] overflow-y-auto bg-sps-graphite p-4 font-sps text-white shadow-xl"
              >
                <Dialog.Title className="sr-only">
                  Project conversations
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close sidebar"
                    className={`absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/10 ${kit.focus}`}
                  >
                    <Icon name="x" />
                  </button>
                </Dialog.Close>
                {sidebar(true)}
              </Dialog.Content>
            </Dialog.Portal>
          ) : (
            <aside
              id={`${id}-sidebar`}
              hidden={!sidebarOpen}
              className={`${sidebarOpen ? "block" : "hidden"} min-w-0 overflow-y-auto bg-sps-graphite p-4 text-white`}
              aria-label="Project conversations"
            >
              {sidebar(false)}
            </aside>
          )}
          <div className="flex min-h-0 min-w-0 flex-col">
            {children(toggle)}
          </div>
        </div>
      </main>
    </Dialog.Root>
  );
}
