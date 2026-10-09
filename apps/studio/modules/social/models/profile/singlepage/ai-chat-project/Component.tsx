"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  TextField,
  Feedback,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { Component as ProfileChats } from "../../../../relations/profiles-to-chats/singlepage/ai-chat-find/index";
import { Component as ChatWorkspace } from "../../../chat/singlepage/ai-chat-workspace/index";
import { ThreadHeader } from "../../../thread/singlepage/ai-chat-workspace/index";
import { Component as ThreadCreate } from "../../../thread/singlepage/ai-chat-create/index";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/Source";
import { SourceDownload } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/index";
import { Component as ProfileNavigation } from "../ai-chat-navigation/index";
export interface IProjectProfileProps {
  data: { id: string; name: string };
  active: boolean;
  onRename: (id: string, name: string) => void;
}
export function Component(props: IProjectProfileProps) {
  return (
    <FilesProvider key={props.data.id}>
      <SourceProvider profileId={props.data.id}>
        <ProfileContent {...props} />
      </SourceProvider>
    </FilesProvider>
  );
}
function ProfileContent({ data, active, onRename }: IProjectProfileProps) {
  const id = useId();
  const [settings, setSettings] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [name, setName] = useState(data.name);
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const workspaceRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const mobile = entry.contentRect.width < 760;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const openSettings = useCallback(() => {
    setSettings(true);
    setCreatingThread(false);
    setMobileOpen(false);
  }, []);
  const openDocument = useCallback(() => {
    setSettings(false);
    setCreatingThread(false);
    setMobileOpen(false);
  }, []);
  const openThreadCreate = useCallback(() => {
    setSettings(false);
    setCreatingThread(true);
    setMobileOpen(false);
  }, []);
  const sidebarContent = (
    <ProfileNavigation
      name={data.name}
      mobile={isMobile}
      settingsSelected={settings}
      creatingThread={creatingThread}
      onSettings={openSettings}
      onDocument={openDocument}
      onNewThread={openThreadCreate}
    />
  );
  const toggle = isMobile ? (
    <Dialog.Trigger asChild>
      <Button
        variant="plain"
        className="min-h-9 shrink-0 px-2"
        aria-label="Show sidebar"
        title="Show sidebar"
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
  const chatId = `${data.id}:project-chat`;
  return (
    <Dialog.Root
      modal={false}
      open={active && isMobile && mobileOpen}
      onOpenChange={setMobileOpen}
    >
      <main
        ref={workspaceRef}
        data-ds-block="social.profile.ai-chat-project"
        data-profile-id={data.id}
        className="@container/workspace mx-auto max-w-[1440px] px-4 py-6 @[640px]:px-5"
      >
        <div
          id={active ? "documents" : `${id}-documents`}
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
                {sidebarContent}
              </Dialog.Content>
            </Dialog.Portal>
          ) : (
            <aside
              id={`${id}-sidebar`}
              hidden={!sidebarOpen}
              className={`${sidebarOpen ? "block" : "hidden"} min-w-0 overflow-y-auto bg-sps-graphite p-4 text-white`}
              aria-label="Project conversations"
            >
              {sidebarContent}
            </aside>
          )}
          <div className="flex min-h-0 min-w-0 flex-col">
            {creatingThread && (
              <section
                aria-label="Create thread"
                className="flex min-h-0 flex-1 flex-col"
              >
                <ThreadHeader
                  title="New thread"
                  label="Thread"
                  navigation={toggle}
                />
                <ThreadCreate onCancel={openDocument} />
              </section>
            )}
            {settings && (
              <section
                aria-label="Project settings"
                className="flex min-h-0 flex-1 flex-col"
              >
                <ThreadHeader
                  title="Project settings"
                  label="Project"
                  navigation={toggle}
                />
                <div className="space-y-6 p-5">
                  <form
                    className="flex max-w-xl flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!name.trim()) return;
                      onRename(data.id, name.trim());
                      setSaved(true);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <TextField
                        label="Project name"
                        value={name}
                        className="mt-2"
                        onChange={(event) => {
                          setName(event.target.value);
                          setSaved(false);
                        }}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!name.trim() || name.trim() === data.name}
                    >
                      Save name
                    </Button>
                  </form>
                  {saved && <Feedback>Project name saved.</Feedback>}
                  <div className="border-t border-sps-line pt-5">
                    <SourceDownload label="Export Products.md" />
                  </div>
                </div>
              </section>
            )}
            <div
              hidden={settings || creatingThread}
              className={`${settings || creatingThread ? "hidden" : "flex"} min-h-0 flex-1 flex-col`}
            >
              <ProfileChats
                variant="find"
                data={[{ id: `${chatId}:project`, profileId: data.id, chatId }]}
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        { column: "profileId", method: "eq", value: data.id },
                      ],
                    },
                  },
                }}
              >
                {(links) =>
                  links.some((link) => link.chatId === chatId) ? (
                    <ChatWorkspace profileId={data.id} navigation={toggle} />
                  ) : (
                    <p role="status">Chat unavailable.</p>
                  )
                }
              </ProfileChats>
            </div>
          </div>
        </div>
      </main>
    </Dialog.Root>
  );
}
