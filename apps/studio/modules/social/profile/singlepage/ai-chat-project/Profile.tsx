"use client";
import { createContext, useContext, type ReactNode } from "react";
import { FilesProvider } from "../../../../file-storage/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../knowledge/source/singlepage/ai-chat-document/Source";
import { ThreadProvider } from "../../../thread/singlepage/ai-chat-overview/Thread";
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
