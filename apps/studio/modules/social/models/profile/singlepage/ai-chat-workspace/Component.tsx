"use client";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Icon,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  createProjectProfile,
  type IProjectProfile,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import { AccountHeader } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import {
  CreateProjectScreen,
  ProjectProcessingDisclosure,
} from "./ProjectSetup";
import { Component as ProjectProfile } from "../ai-chat-project/index";
import { Component as ProjectProfileSelect } from "../ai-chat-project-select/index";
import { Component as ProfileChats } from "../../../../relations/profiles-to-chats/singlepage/ai-chat-find/index";
import {
  linkProjectProfile,
  projectProfilesForUser,
  projectProfileIdFromHref,
  type IAIChatUserProfile,
  type IProjectLinks,
} from "../../../../../../workspace/utils/products/ai-chat-models";
export interface IProjectWorkspaceProps {
  data: IAIChatUserProfile;
  initialLinks?: IProjectLinks;
  onNavigateHref?: (href: string) => void;
  initialProjects?: IProjectProfile[];
  initialProjectId?: string;
  text?: string;
  navigationHref?: string;
}

export function Component({
  data,
  initialLinks = { chats: [], profilesToChats: [] },
  onNavigateHref,
  navigationHref,
  initialProjects = [],
  initialProjectId,
}: IProjectWorkspaceProps) {
  const id = useId();
  const sequence = useRef(0);
  const [projects, setProjects] = useState<IProjectProfile[]>(initialProjects);
  const [links, setLinks] = useState(initialLinks);
  const availableProjects = useMemo(
    () => projectProfilesForUser(data.id, projects, links),
    [data.id, projects, links],
  );
  const routeId = navigationHref
    ?.split(/[?#]/)[0]
    .match(/^\/ai-chat\/projects\/([^/]+)$/)?.[1];
  const requestedId = projectProfileIdFromHref(navigationHref);
  const [selected, setSelected] = useState(
    requestedId ?? initialProjectId ?? availableProjects[0]?.id ?? "",
  );
  const [creating, setCreating] = useState(
    routeId === "new" || (!requestedId && !availableProjects.length),
  );
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const fileUrls = useRef(new Set<string>());
  useEffect(() => {
    for (const project of projects) {
      const files = [
        ...project.sources,
        ...project.documents.flatMap((document) => document.draftFiles ?? []),
        ...project.topics.flatMap((topic) => topic.draftFiles ?? []),
        ...project.documents.flatMap((document) =>
          [...(document.assets ?? []), ...(document.savedAssets ?? [])].flatMap(
            (asset) =>
              asset.delivery ? [asset.file, asset.delivery] : [asset.file],
          ),
        ),
      ];
      files.forEach((file) => {
        if (file.fileUrl) fileUrls.current.add(file.fileUrl);
      });
    }
  }, [projects]);
  useEffect(
    () => () => {
      fileUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  useLayoutEffect(() => {
    if (
      navigationHref?.startsWith("/ai-chat/projects/new") &&
      !navigationHref.includes("how-your-materials")
    )
      setCreating(true);
    if (requestedId) {
      setSelected(requestedId);
      setCreating(false);
    }
    if (navigationHref?.includes("how-your-materials")) setDisclosureOpen(true);
  }, [navigationHref, requestedId]);
  const updateProject = useCallback(
    (
      projectId: string,
      update: (project: IProjectProfile) => IProjectProfile,
    ) => {
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId ? update(project) : project,
        ),
      );
    },
    [],
  );
  function createProject(name: string) {
    const project = createProjectProfile(`${id}-${++sequence.current}`, name);
    setProjects((current) => [...current, project]);
    setLinks((current) => linkProjectProfile(current, data.id, project));
    setSelected(project.id);
    setCreating(false);
    onNavigateHref?.(`/ai-chat/projects/${encodeURIComponent(project.id)}`);
  }
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="social.profile.ai-chat-workspace"
      data-profile-id={data.id}
      className="@container min-h-screen bg-sps-grey text-sps-graphite font-sps"
    >
      <AccountHeader
        page="chat"
        projectNavigation={({ onNavigate, onCloseAutoFocus }) => (
          <ProfileChats
            variant="find"
            data={links.profilesToChats}
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "profileId", method: "eq", value: data.id }],
                },
              },
            }}
          >
            {(relations) => (
              <ProjectProfileSelect
                data={projectProfilesForUser(data.id, projects, {
                  chats: links.chats,
                  profilesToChats: [
                    ...links.profilesToChats.filter(
                      (relation) => relation.profileId !== data.id,
                    ),
                    ...relations,
                  ],
                }).map((profile) => ({ id: profile.id, title: profile.name }))}
                value={selected}
                onChange={(value) => {
                  setSelected(value);
                  onNavigateHref?.(
                    `/ai-chat/projects/${encodeURIComponent(value)}`,
                  );
                  setCreating(false);
                  onNavigate();
                }}
                onCreate={() => {
                  setCreating(true);
                  onNavigateHref?.("/ai-chat/projects/new");
                  onNavigate();
                }}
                onCloseAutoFocus={onCloseAutoFocus}
              />
            )}
          </ProfileChats>
        )}
      />
      {creating && (
        <CreateProjectScreen
          key={`${projects.length}-create`}
          onCreate={createProject}
          onCancel={
            availableProjects.length
              ? () => {
                  setCreating(false);
                  const selectedId = availableProjects.some(
                    (profile) => profile.id === selected,
                  )
                    ? selected
                    : availableProjects[0].id;
                  setSelected(selectedId);
                  onNavigateHref?.(
                    `/ai-chat/projects/${encodeURIComponent(selectedId)}`,
                  );
                }
              : undefined
          }
        />
      )}
      {disclosureOpen && creating && (
        <div className="mx-auto max-w-3xl px-5 pb-5">
          <ProjectProcessingDisclosure
            id="how-your-materials-are-processed-and-stored"
            open
          />
          <Button variant="plain" onClick={() => setDisclosureOpen(false)}>
            Close
          </Button>
        </div>
      )}
      {!creating &&
        !availableProjects.some((profile) => profile.id === selected) && (
          <main className="mx-auto max-w-3xl p-6" role="status">
            Project profile unavailable. Choose a project from your profile.
          </main>
        )}
      {availableProjects.map((project) => (
        <div key={project.id} hidden={creating || selected !== project.id}>
          <ProjectProfile
            project={project}
            active={!creating && selected === project.id}
            navigationHref={
              selected === project.id ? navigationHref : undefined
            }
            onUpdate={updateProject}
          />
        </div>
      ))}
    </div>
  );
}
