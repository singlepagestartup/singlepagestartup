"use client";
import { createContext, useContext, type ReactNode } from "react";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";
import { ThreadProvider } from "../../../../../thread/singlepage/overview/ai-chat/Thread";
import type { IAIChatSource } from "./models";
import type { IProjectFile } from "./state";
interface IProjectProviderProps {
  initialSource?: IAIChatSource;
  initialFiles?: IProjectFile[];
  profileId: string;
  children: ReactNode;
}
const ProjectContext = createContext<string | null>(null);
// A preview may keep this scope mounted across pages; pages also work on their own.
export function ProjectProvider({
  profileId,
  children,
  initialSource,
  initialFiles,
}: IProjectProviderProps) {
  const existing = useContext(ProjectContext);
  if (existing === profileId) return children;
  return (
    <ProjectContext.Provider value={profileId}>
      <FilesProvider key={profileId} initialFiles={initialFiles}>
        <SourceProvider
          profileId={profileId}
          initialSource={initialSource}
          initialFileIds={initialFiles?.map((file) => file.id)}
        >
          <ThreadProvider>{children}</ThreadProvider>
        </SourceProvider>
      </FilesProvider>
    </ProjectContext.Provider>
  );
}
