"use client";

import { createContext, useContext, type ReactNode } from "react";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { ThreadProvider } from "../../../../../thread/singlepage/id/ai-chat/Thread";
import type { IProjectFile, IProjectMessage } from "./state";
import type { IAIChatSource } from "./models";
export interface IProjectPreviewState {
  source: IAIChatSource;
  files: IProjectFile[];
  sourceFileIds: string[];
  draftFileIds?: string[];
  draft?: string;
  messages?: IProjectMessage[];
}
interface IProjectProviderProps {
  profileId: string;
  children: ReactNode;
  preview?: IProjectPreviewState;
}
const ProjectContext = createContext<string | null>(null);
// A preview may keep this scope mounted across pages; pages also work on their own.
export function ProjectProvider({
  profileId,
  children,
  preview,
}: IProjectProviderProps) {
  const existing = useContext(ProjectContext);
  if (existing === profileId) return children;
  return (
    <ProjectContext.Provider value={profileId}>
      <FilesProvider key={profileId} initialFiles={preview?.files}>
        <SourceProvider
          profileId={profileId}
          initialSource={preview?.source}
          initialFileIds={preview?.sourceFileIds}
        >
          <ThreadProvider
            initialDraft={preview?.draft}
            initialFileIds={preview?.draftFileIds}
            initialMessages={preview?.messages}
          >
            {children}
          </ThreadProvider>
        </SourceProvider>
      </FilesProvider>
    </ProjectContext.Provider>
  );
}
