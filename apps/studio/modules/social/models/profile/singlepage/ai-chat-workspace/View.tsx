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
import ProjectChat from "../../../../relations/chats-to-threads/singlepage/ai-chat-workspace/View";
import { Component as ProjectProfileSelect } from "../ai-chat-project-select/index";
export interface IProjectWorkspaceProps {
  initialProjects?: IProjectProfile[];
  initialProjectId?: string;
  text?: string;
  navigationHref?: string;
}

export default function ProjectWorkspace({
  navigationHref,
  initialProjects = [],
  initialProjectId,
}: IProjectWorkspaceProps = {}) {
  const id = useId();
  const sequence = useRef(0);
  const [projects, setProjects] = useState<IProjectProfile[]>(initialProjects);
  const profiles = useMemo(
    () => projects.map((profile) => ({ id: profile.id, title: profile.name })),
    [projects],
  );
  const [selected, setSelected] = useState(
    initialProjectId ?? initialProjects[0]?.id ?? "",
  );
  const [creating, setCreating] = useState(
    !initialProjects.length ||
      navigationHref?.startsWith("/ai-chat/projects/new") === true,
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
    if (navigationHref?.includes("how-your-materials")) setDisclosureOpen(true);
  }, [navigationHref]);
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
    setSelected(project.id);
    setCreating(false);
  }
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="social.profile.ai-chat-workspace"
      className="@container min-h-screen bg-sps-grey text-sps-graphite font-sps"
    >
      <AccountHeader
        page="chat"
        projectNavigation={({ onNavigate, onCloseAutoFocus }) => (
          <ProjectProfileSelect
            data={profiles}
            value={selected}
            onChange={(value) => {
              setSelected(value);
              setCreating(false);
              onNavigate();
            }}
            onCreate={() => {
              setCreating(true);
              onNavigate();
            }}
            onCloseAutoFocus={onCloseAutoFocus}
          />
        )}
      />
      {creating && (
        <CreateProjectScreen
          key={`${projects.length}-create`}
          onCreate={createProject}
          onCancel={projects.length ? () => setCreating(false) : undefined}
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
      {projects.map((project) => (
        <div key={project.id} hidden={creating || selected !== project.id}>
          <ProjectChat
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
