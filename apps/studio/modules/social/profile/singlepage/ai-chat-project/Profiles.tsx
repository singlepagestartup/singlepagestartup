"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
export interface IProjectIdentity {
  id: string;
  name: string;
  variant: "ai-chat-project";
}
export interface IProfilesProviderProps {
  initialProjects?: IProjectIdentity[];
  children: ReactNode;
}
interface IProfilesContext {
  projects: IProjectIdentity[];
  rename: (id: string, name: string) => void;
  create: (name: string) => string | undefined;
}
const ProfilesContext = createContext<IProfilesContext | null>(null);
export function ProfilesProvider({
  initialProjects = [],
  children,
}: IProfilesProviderProps) {
  const [projects, setProjects] = useState(initialProjects);
  const rename = useCallback((id: string, name: string) => {
    setProjects((current) =>
      current.map((profile) =>
        profile.id === id ? { ...profile, name } : profile,
      ),
    );
  }, []);
  const create = useCallback((name: string) => {
    if (!name.trim()) return;
    const profile: IProjectIdentity = {
      id: crypto.randomUUID(),
      name: name.trim(),
      variant: "ai-chat-project",
    };
    setProjects((current) => [...current, profile]);
    return profile.id;
  }, []);
  return (
    <ProfilesContext.Provider value={{ projects, rename, create }}>
      {children}
    </ProfilesContext.Provider>
  );
}
export function useProfiles() {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error("Project profiles require ProfilesProvider.");
  return context;
}
