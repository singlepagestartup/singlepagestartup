"use client";
import { createContext, useContext, type ReactNode } from "react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-document/Source";
import { ProductsThreadProvider } from "../../../thread/singlepage/ai-chat-products/Thread";
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
          <ProductsThreadProvider profileId={profileId}>
            {children}
          </ProductsThreadProvider>
        </SourceProvider>
      </FilesProvider>
    </ProjectContext.Provider>
  );
}
