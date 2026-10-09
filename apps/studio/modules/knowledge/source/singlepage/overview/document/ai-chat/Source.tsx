"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { IAIChatSource } from "../../../../../../../workspace/utils/products/ai-chat-models";
import { editSourceUserContext } from "../../../../../../../workspace/utils/products/ai-chat-knowledge";

interface ISourceContext {
  source: IAIChatSource;
  fileIds: string[];
  edit: (value: string) => void;
  attach: (fileIds: string[]) => void;
  detach: (fileId: string) => void;
}
interface ISourceProviderProps {
  profileId: string;
  children: ReactNode;
  initialSource?: IAIChatSource;
  initialFileIds?: string[];
}
const SourceContext = createContext<ISourceContext | null>(null);
export function SourceProvider({
  profileId,
  children,
  initialSource,
  initialFileIds = [],
}: ISourceProviderProps) {
  const [source, setSource] = useState<IAIChatSource>(
    () =>
      initialSource ?? {
        id: `${profileId}:products:products`,
        slug: `${encodeURIComponent(profileId)}:products:products`,
        variant: "overview-ai-chat",
        title: "Products",
        content: "",
        description:
          "Describe the products, their customers, value and current availability.",
      },
  );
  const [fileIds, setFileIds] = useState(initialFileIds);
  const edit = useCallback(
    (value: string) =>
      setSource((current) => ({
        ...current,
        content: editSourceUserContext(current.content, value),
      })),
    [],
  );
  const attach = useCallback(
    (ids: string[]) =>
      setFileIds((current) => [...new Set([...current, ...ids])]),
    [],
  );
  const detach = useCallback(
    (id: string) =>
      setFileIds((current) => current.filter((fileId) => fileId !== id)),
    [],
  );
  return (
    <SourceContext.Provider value={{ source, fileIds, edit, attach, detach }}>
      {children}
    </SourceContext.Provider>
  );
}
export function useSource() {
  const context = useContext(SourceContext);
  if (!context) throw new Error("AI Chat Source requires SourceProvider.");
  return context;
}
