"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAIChatAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import {
  linkProjectProfile,
  projectProfilesForUser,
  type IProjectLinks,
} from "../../../../../../workspace/utils/products/ai-chat-models";
export interface IProjectIdentity {
  id: string;
  name: string;
  variant: "ai-chat-project";
}
export interface IProfilesProviderProps {
  initialProjects?: IProjectIdentity[];
  initialLinks?: IProjectLinks;
  children: ReactNode;
}
interface IProfilesContext {
  projects: IProjectIdentity[];
  links: IProjectLinks;
  userProfileId?: string;
  rename: (id: string, name: string) => void;
  create: (name: string) => string | undefined;
}
const ProfilesContext = createContext<IProfilesContext | null>(null);
export function ProfilesProvider({
  initialProjects = [],
  initialLinks = { chats: [], profilesToChats: [] },
  children,
}: IProfilesProviderProps) {
  const account = useAIChatAccount();
  const userProfileId =
    account.subject &&
    account.profiles?.find(
      (profile) =>
        profile.variant === "ai-chat-user" &&
        account.subjectsToProfiles?.some(
          (link) =>
            link.subjectId === account.subject?.id &&
            link.socialModuleProfileId === profile.id,
        ),
    )?.id;
  const [records, setRecords] = useState(initialProjects);
  const [links, setLinks] = useState(initialLinks);
  const projects = useMemo(
    () =>
      userProfileId
        ? projectProfilesForUser(userProfileId, records, links)
        : [],
    [userProfileId, records, links],
  );
  const rename = useCallback((id: string, name: string) => {
    setRecords((current) =>
      current.map((profile) =>
        profile.id === id ? { ...profile, name } : profile,
      ),
    );
    setLinks((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === `${id}:project-chat` ? { ...chat, title: name } : chat,
      ),
    }));
  }, []);
  const create = useCallback(
    (name: string) => {
      if (!userProfileId || !name.trim()) return;
      const profile: IProjectIdentity = {
        id: crypto.randomUUID(),
        name: name.trim(),
        variant: "ai-chat-project",
      };
      setRecords((current) => [...current, profile]);
      setLinks((current) =>
        linkProjectProfile(current, userProfileId, profile),
      );
      return profile.id;
    },
    [userProfileId],
  );
  return (
    <ProfilesContext.Provider
      value={{ projects, links, userProfileId, rename, create }}
    >
      {children}
    </ProfilesContext.Provider>
  );
}
export function useProfiles() {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error("Project profiles require ProfilesProvider.");
  return context;
}
