"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { IProjectFile } from "../../../../../workspace/utils/products/ai-chat-workspace";

interface IFilesContext {
  files: IProjectFile[];
  register: (files: IProjectFile[]) => void;
}
interface IFilesProviderProps {
  children: ReactNode;
  initialFiles?: IProjectFile[];
}
const FilesContext = createContext<IFilesContext | null>(null);

export function FilesProvider({
  children,
  initialFiles = [],
}: IFilesProviderProps) {
  const [files, setFiles] = useState(initialFiles);
  const ownedUrls = useRef(new Set<string>());
  const register = useCallback((uploaded: IProjectFile[]) => {
    uploaded.forEach((file) => {
      if (file.fileUrl?.startsWith("blob:"))
        ownedUrls.current.add(file.fileUrl);
    });
    setFiles((current) => [
      ...new Map(
        [...current, ...uploaded].map((file) => [file.id, file]),
      ).values(),
    ]);
  }, []);
  useEffect(
    () => () => {
      ownedUrls.current.forEach((url) => URL.revokeObjectURL(url));
      ownedUrls.current.clear();
    },
    [],
  );
  return (
    <FilesContext.Provider value={{ files, register }}>
      {children}
    </FilesContext.Provider>
  );
}
export function useFiles() {
  const context = useContext(FilesContext);
  if (!context) throw new Error("AI Chat File requires FilesProvider.");
  return context;
}
