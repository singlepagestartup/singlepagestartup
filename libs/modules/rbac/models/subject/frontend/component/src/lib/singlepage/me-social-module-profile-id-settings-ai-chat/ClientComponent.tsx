"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { queryClient } from "@sps/shared-frontend-client-api";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { getProjectsQueryKey } from "../me-social-module-profile-id-chat-id-thread-id-ai-chat/utils";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const { project } = props;
  const router = useRouter();
  const savedName = project.profile.title?.en || project.profile.adminTitle;
  const [name, setName] = useState(savedName);
  const [status, setStatus] = useState("");
  const scope = {
    id: props.data.id,
    socialModuleProfileId: project.requesterProfileId,
    socialModuleChatId: project.chat.id,
    targetSocialModuleProfileId: project.profile.id,
  };
  const update =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
      scope,
    );
  return (
    <div className="min-w-0 flex-1">
      <header className="border-b border-border p-5">
        <p className="text-xs text-muted-foreground">Project</p>
        <h1 className="mt-1 text-base font-semibold">Project settings</h1>
      </header>
      <form
        className="p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("");
          try {
            await update.mutateAsync({
              ...scope,
              data: {
                adminTitle: name.trim(),
                title: { ...project.profile.title, en: name.trim() },
              },
            });
            await queryClient.invalidateQueries({
              predicate: (query) =>
                typeof query.queryKey[0] === "string" &&
                query.queryKey[0].startsWith(
                  `${route}/${scope.id}/social-module/profiles`,
                ),
            });
            await queryClient.invalidateQueries({
              queryKey: getProjectsQueryKey(scope.id),
            });
            setStatus("Project name saved");
            router.refresh();
          } catch (error) {
            setStatus(
              error instanceof Error
                ? error.message
                : "Could not save the project name",
            );
          }
        }}
      >
        <label
          htmlFor="project-settings-name"
          className="text-sm font-semibold"
        >
          Project name
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            id="project-settings-name"
            className="min-h-12 w-full max-w-md rounded-xl border border-border px-4"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            required
          />
          <button
            disabled={update.isPending || !name.trim() || name === savedName}
            className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold disabled:opacity-50"
          >
            {update.isPending ? "Saving…" : "Save name"}
          </button>
        </div>
        {status && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}
