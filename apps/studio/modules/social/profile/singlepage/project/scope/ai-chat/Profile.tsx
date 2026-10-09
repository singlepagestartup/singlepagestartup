"use client";
import { createContext, useContext, type ReactNode } from "react";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";
import { ThreadProvider } from "../../../../../thread/singlepage/overview/ai-chat/Thread";
interface IProjectProviderProps {
  profileId: string;
  children: ReactNode;
}
const ProjectContext = createContext<string | null>(null);
// A preview may keep this scope mounted across pages; pages also work on their own.
export function ProjectProvider({
  profileId,
  children,
}: IProjectProviderProps) {
  const existing = useContext(ProjectContext);
  if (existing === profileId) return children;
  return (
    <ProjectContext.Provider value={profileId}>
      <FilesProvider key={profileId}>
        <SourceProvider profileId={profileId}>
          <ThreadProvider>{children}</ThreadProvider>
        </SourceProvider>
      </FilesProvider>
    </ProjectContext.Provider>
  );
}
