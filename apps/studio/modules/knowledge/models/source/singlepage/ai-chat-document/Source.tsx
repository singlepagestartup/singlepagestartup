"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  IAIChatSource,
  ISourceFileRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";
import { editSourceUserContext } from "../../../../../../workspace/utils/products/ai-chat-knowledge";
import { Component as ProfileSources } from "../../../../../social/relations/profiles-to-knowledge-module-sources/singlepage/ai-chat-find/index";

interface ISourceContext {
  source: IAIChatSource;
  fileLinks: ISourceFileRelation[];
  edit: (value: string) => void;
  attach: (fileIds: string[]) => void;
  detach: (fileId: string) => void;
}
interface ISourceProviderProps {
  profileId: string;
  children: ReactNode;
  initialSource?: IAIChatSource;
  initialFileLinks?: ISourceFileRelation[];
}
const SourceContext = createContext<ISourceContext | null>(null);
export function SourceProvider({
  profileId,
  children,
  initialSource,
  initialFileLinks = [],
}: ISourceProviderProps) {
  const [source, setSource] = useState<IAIChatSource>(
    () =>
      initialSource ?? {
        id: `${profileId}:products:products`,
        slug: `${encodeURIComponent(profileId)}:products:products`,
        variant: "ai-chat-card",
        title: "Products",
        content: "",
        description:
          "Describe the products, their customers, value and current availability.",
      },
  );
  const [fileLinks, setFileLinks] = useState(initialFileLinks);
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
      setFileLinks((current) => {
        const linked = new Set(
          current
            .filter((link) => link.sourceId === source.id)
            .map((link) => link.fileStorageModuleFileId),
        );
        let order = Math.max(
          -1,
          ...current
            .filter((link) => link.sourceId === source.id)
            .map((link) => link.orderIndex),
        );
        const added = [...new Set(ids)]
          .filter((id) => !linked.has(id))
          .map((id) => ({
            id: `${source.id}:file:${id}`,
            sourceId: source.id,
            fileStorageModuleFileId: id,
            orderIndex: ++order,
          }));
        return [...current, ...added];
      }),
    [source.id],
  );
  const detach = useCallback(
    (id: string) =>
      setFileLinks((current) =>
        current.filter(
          (link) =>
            link.sourceId !== source.id || link.fileStorageModuleFileId !== id,
        ),
      ),
    [source.id],
  );
  return (
    <ProfileSources
      variant="find"
      data={[
        {
          id: `${source.id}:profile`,
          profileId,
          knowledgeModuleSourceId: source.id,
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: profileId }],
          },
        },
      }}
    >
      {(links) =>
        links.some((link) => link.knowledgeModuleSourceId === source.id) ? (
          <SourceContext.Provider
            value={{ source, fileLinks, edit, attach, detach }}
          >
            {children}
          </SourceContext.Provider>
        ) : null
      }
    </ProfileSources>
  );
}
export function useSource() {
  const context = useContext(SourceContext);
  if (!context) throw new Error("AI Chat Source requires SourceProvider.");
  return context;
}
