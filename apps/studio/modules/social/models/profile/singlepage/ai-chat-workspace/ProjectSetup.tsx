"use client";
import { useId, useState, type FormEvent } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Button,
  Icon,
  kit,
  SquareImage,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import {
  TextField,
  Feedback,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import {
  hasProjectMaterials,
  type IProjectProfile,
  type IProjectFile,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import { readProjectFiles } from "../../../../../../workspace/utils/products/ai-chat-files";
import disclosure from "./disclosure.json";

interface ICreateProjectProps {
  onCreate: (name: string) => void;
  onCancel?: () => void;
}
interface IProjectSetupProps {
  project: IProjectProfile;
  analysisStep: number;
  disclosureId: string;
  onNotes: (notes: string) => void;
  onFiles: (sources: IProjectFile[]) => void;
  onRemove: (id: string) => void;
  onAnalyze: () => void;
  onOpenDocuments: () => void;
  onBack: () => void;
}
interface IProjectStepsProps {
  step: number;
}
interface IProjectProcessingDisclosureProps {
  id: string;
  open?: boolean;
}

export function ProjectProcessingDisclosure({
  id,
  open,
}: IProjectProcessingDisclosureProps) {
  return (
    <details
      id={id}
      open={open}
      className={`my-5 text-xs leading-6 ${kit.muted}`}
    >
      <summary
        className={`min-h-9 cursor-pointer underline underline-offset-4 ${kit.focus}`}
      >
        How your materials are processed and stored
      </summary>
      <div className={`${kit.card} mt-3 text-sm`}>
        <MarkdownDocument>{disclosure}</MarkdownDocument>
      </div>
    </details>
  );
}

export function ProjectSteps({ step }: IProjectStepsProps) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="-mx-4 mb-6 overflow-x-auto overscroll-x-contain border-b border-sps-line @[640px]:-mx-5">
        <ol
          aria-label="Project setup progress"
          className="flex min-w-max items-center gap-4 px-4 pb-5 @[640px]:px-5 @[800px]:gap-6"
        >
          {[
            {
              label: "Name",
              description:
                "Give this project a name so its files, documents and conversations stay together. You can create a separate project for another idea.",
            },
            {
              label: "Materials",
              description:
                "Upload your notes, documents, photos and references. Add what you already know so the AI agent can work from your material.",
            },
            {
              label: "Analysis",
              description:
                "The AI agent checks your material, prepares document drafts and identifies missing information for you to add.",
            },
            {
              label: "Documents",
              description:
                "Review each document with the AI agent. Correct mistakes, add missing details and improve the text, then save a reviewed version. These documents will be the knowledge base for your project threads.",
            },
            {
              label: "Work",
              description:
                "Create a conversation about a task and attach the reviewed documents it needs. The AI agent uses those documents and the files you share in that thread as context.",
            },
          ].map(({ label, description }, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={`flex min-w-0 items-center gap-2 text-xs ${index === step ? "font-semibold" : kit.muted}`}
            >
              {index < step ? (
                <StepExplanation
                  label={label}
                  description={description}
                  complete
                />
              ) : (
                <>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full ${index === step ? "bg-sps-green text-sps-graphite" : "bg-sps-white"}`}
                  >
                    {index + 1}
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                  <StepExplanation label={label} description={description} />
                </>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Tooltip.Provider>
  );
}

function StepExplanation({
  label,
  description,
  complete = false,
}: {
  label: string;
  description: string;
  complete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={`About ${label}`}
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full ${complete ? "bg-sps-green text-sps-graphite" : "text-sps-muted hover:bg-sps-white hover:text-sps-graphite"} ${kit.focus}`}
        >
          <Icon
            name={complete ? "check" : "question"}
            className={complete ? "size-3" : "size-4"}
          />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={8}
          collisionPadding={12}
          className="z-50 max-w-72 rounded-xl border border-sps-line bg-sps-graphite p-3 text-xs font-normal leading-5 text-sps-white shadow-lg font-sps"
        >
          {description}
          <Tooltip.Arrow className="fill-sps-graphite" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function CreateProjectScreen({
  onCreate,
  onCancel,
}: ICreateProjectProps) {
  const [name, setName] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 @[640px]:px-5">
      <ProjectSteps step={0} />
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-sps-line bg-sps-white @[760px]:grid-cols-2">
        <section className="flex flex-col justify-center p-6 @[640px]:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-sps-green" />
          <h1 className="text-3xl font-semibold leading-tight">
            Start with a name.
          </h1>
          <p className={`mt-4 text-sm leading-6 ${kit.muted}`}>
            Create a project, then add the notes, documents and images you
            already have.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <TextField
              label="Project name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What are you working on?"
              required
              autoComplete="off"
              maxLength={100}
            />
            <Button type="submit" disabled={!name.trim()}>
              <Icon name="plus" />
              Create project
            </Button>
            {onCancel && (
              <Button variant="plain" onClick={onCancel}>
                Back to my project
              </Button>
            )}
          </form>
        </section>
        <div className="relative hidden min-w-0 @[760px]:block">
          <SquareImage
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png"
            alt="A person working on their project at a desk"
            className="h-full min-h-96 w-full rounded-none object-cover"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-sps-graphite p-5 text-white">
            <p className="font-semibold">Your files. Your project.</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Work through each document with the AI agent, then use what you
              have saved in new conversations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export function ProjectSetup({
  project,
  analysisStep,
  disclosureId,
  onNotes,
  onFiles,
  onRemove,
  onAnalyze,
  onOpenDocuments,
  onBack,
}: IProjectSetupProps) {
  const id = useId();
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  async function receiveFiles(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    setFileError("");
    try {
      onFiles(await readProjectFiles(files, id));
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "The files could not be added. Try again.",
      );
    } finally {
      setReading(false);
    }
  }
  const analyzing = project.stage === "analysis";
  const ready = analysisStep === 3;
  return (
    <>
      <ProjectSteps step={analyzing ? 2 : 1} />
      {analyzing ? (
        <section
          id="analysis"
          aria-label="Project analysis"
          className={`${kit.card} mx-auto max-w-3xl p-6 @[640px]:p-8`}
        >
          <span className="grid size-12 place-items-center rounded-xl bg-sps-green">
            <Icon
              name={ready ? "check" : "robot"}
              className={!ready ? "motion-safe:animate-pulse" : ""}
            />
          </span>
          <h2 className="mt-5 text-2xl font-semibold">
            {ready
              ? "Your documents are ready to work on."
              : "Preparing your project documents."}
          </h2>
          <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
            Review the drafts in each file's chat. Missing information stays
            open until you add it.
          </p>
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Analysis sources"
          >
            {project.notes.trim() && (
              <span className="rounded-lg bg-sps-grey px-3 py-2 text-xs">
                Project notes
              </span>
            )}
            {project.sources.map((source) => (
              <span
                key={source.id}
                className="max-w-full break-words rounded-lg bg-sps-grey px-3 py-2 text-xs"
              >
                {source.name}
              </span>
            ))}
          </div>
          <ol aria-live="polite" className="mt-6 space-y-4">
            {[
              "Collect supplied files and notes",
              "Keep source material with the project",
              "Prepare document sections and questions",
            ].map((label, index) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <Icon
                  name={analysisStep > index ? "check-circle" : "clock"}
                  className={
                    analysisStep > index ? "text-sps-graphite" : kit.muted
                  }
                />
                {label}
                {analysisStep === index && (
                  <span className={`ml-auto text-xs ${kit.muted}`}>
                    In progress
                  </span>
                )}
              </li>
            ))}
          </ol>
          <progress
            max={3}
            value={analysisStep}
            aria-label="Analysis progress"
            className="mt-6 block h-2 w-full appearance-none overflow-hidden rounded-full bg-sps-line [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-sps-green [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-sps-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-sps-green"
          />
          {ready && (
            <div className="mt-6">
              <ul className="divide-y divide-sps-line">
                {project.documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex flex-wrap items-center gap-2 py-3 text-sm"
                  >
                    <Icon name="file-text" />
                    {document.title}.md
                    <span className={`ml-auto text-xs ${kit.muted}`}>
                      {
                        document.sections.filter(
                          (field) => !document.values[field.title]?.trim(),
                        ).length
                      }{" "}
                      fields need information
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="mt-5" onClick={onOpenDocuments}>
                Open document chats
                <Icon name="arrow-right" />
              </Button>
            </div>
          )}
          <Button variant="plain" className="mt-4" onClick={onBack}>
            <Icon name="arrow-left" />
            Back to materials
          </Button>
        </section>
      ) : (
        <section
          id="materials"
          aria-label="Project materials"
          className="mx-auto max-w-3xl"
        >
          <h2 className="text-3xl font-semibold">Bring what you have.</h2>
          <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
            Add notes, documents or images. You can explain the project in your
            own words too.
          </p>
          <ProjectProcessingDisclosure id={disclosureId} />
          <label
            htmlFor={`${id}-files`}
            className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sps-line bg-sps-white p-6 text-center focus-within:ring-2 focus-within:ring-sps-graphite ${reading ? "opacity-60" : ""}`}
          >
            <Icon name="paperclip" className="size-7" />
            <span className="font-semibold">
              {reading ? "Adding files…" : "Choose files"}
            </span>
            <span className={`text-xs ${kit.muted}`}>
              Documents, notes, photographs and references
            </span>
            <input
              id={`${id}-files`}
              aria-label="Upload project files"
              type="file"
              multiple
              disabled={reading}
              className="sr-only"
              onChange={(event) => {
                void receiveFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {fileError && (
            <div className="mt-3">
              <Feedback kind="error">{fileError}</Feedback>
            </div>
          )}
          {project.sources.length > 0 && (
            <ul className={`${kit.card} mt-4 divide-y divide-sps-line`}>
              {project.sources.map((source) => (
                <li
                  key={source.id}
                  className="flex min-w-0 items-center gap-3 py-3"
                >
                  {source.mimeType?.startsWith("image/") && source.fileUrl ? (
                    <img
                      src={source.fileUrl}
                      alt=""
                      className="size-16 shrink-0 rounded-lg object-contain bg-sps-grey"
                    />
                  ) : (
                    <Icon name="file-text" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {source.name}
                    </p>
                    <p className={`text-xs ${kit.muted}`}>
                      {Math.max(1, Math.round(source.size / 1024))} KB
                    </p>
                  </div>
                  <Button
                    variant="plain"
                    aria-label={`Remove ${source.name}`}
                    onClick={() => onRemove(source.id)}
                  >
                    <Icon name="x" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <label
            htmlFor={`${id}-notes`}
            className={`mb-2 mt-6 block ${kit.label}`}
          >
            What should the agent know?
          </label>
          <textarea
            id={`${id}-notes`}
            rows={5}
            className={`${kit.field} resize-y`}
            value={project.notes}
            onChange={(event) => onNotes(event.target.value)}
            placeholder="Describe your project or paste your notes."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={reading || !hasProjectMaterials(project)}
              onClick={onAnalyze}
            >
              <Icon name="robot" />
              Analyze materials
            </Button>
            {project.documents.length > 0 && (
              <Button variant="secondary" onClick={onOpenDocuments}>
                Back to document chats
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
