"use client";
import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as SocialModuleThread } from "@sps/social/models/thread/frontend/component";
import type { IClientComponentProps } from "./interface";
export function Component(props: IClientComponentProps) {
  const project = props.project;
  const router = useRouter();
  const [target, setTarget] = useState("whole");
  const [profileId, setProfileId] = useState<string | null>(null);
  const openProfile = useCallback((id: string) => setProfileId(id), []);
  const closeProfile = useCallback(() => setProfileId(null), []);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const onDiscuss = useCallback((id: string) => setTarget(id), []);
  const thread = props.threads?.find(
    (thread) => thread.id === (props.threadId || project.thread.id),
  );
  if (props.threadsLoading)
    return (
      props.loading ?? (
        <p role="status" className="p-8">
          Loading thread…
        </p>
      )
    );
  if (!thread) {
    if (props.renderLoadError)
      return props.renderLoadError({
        retry: () => {
          if (props.retryThreads) props.retryThreads();
          else router.refresh();
        },
        unavailable: !props.threadsError && !thread,
      });
    return (
      <p role="alert" className="p-8 text-destructive">
        {props.threadsError ||
          "This Thread does not belong to the selected Chat."}
      </p>
    );
  }
  const actionProps = { isServer: false, data: props.data, project, thread };
  const document = getAIChatDocument(thread.metadata);
  const isDocument = document?.profileId === project.profile.id;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {navigationOpen && (
        <nav
          aria-label="Project navigation"
          className="bg-default p-4 text-default-foreground lg:hidden"
        >
          {props.navigation}
        </nav>
      )}
      <SocialModuleThread
        isServer={false}
        data={thread}
        dataSource="props"
        variant="id-ai-chat"
        isDocument={isDocument}
        navigation={
          <button
            type="button"
            aria-label="Project navigation"
            aria-expanded={navigationOpen}
            className="flex size-11 items-center justify-center lg:hidden"
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            <Menu className="size-5" />
          </button>
        }
        messages={
          <Subject
            {...actionProps}
            variant="me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat"
            onProfileOpen={openProfile}
          />
        }
        composer={
          <Subject
            {...actionProps}
            variant="me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat"
            target={target}
            onTargetChange={setTarget}
          />
        }
        knowledge={
          isDocument && (
            <Subject
              {...actionProps}
              variant="me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
              onDiscuss={onDiscuss}
            />
          )
        }
        documentDownload={
          isDocument && (
            <Subject
              {...actionProps}
              variant="me-social-module-profile-id-chat-id-thread-id-download-ai-chat"
            />
          )
        }
      />
      {profileId && (
        <Subject
          isServer={false}
          variant="me-social-module-profile-id-sidebar-ai-chat"
          data={props.data}
          project={project}
          profileId={profileId}
          onClose={closeProfile}
        />
      )}
    </div>
  );
}
