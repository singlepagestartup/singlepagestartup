"use client";
import { useState, type FormEvent } from "react";
import {
  Button,
  Icon,
  kit,
  SquareImage,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import { TextField } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import disclosure from "./disclosure.json";
export interface IProfileCreateProps {
  onCreate: (name: string) => void;
  onCancel?: () => void;
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

export function Component({ onCreate, onCancel }: IProfileCreateProps) {
  const [name, setName] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 @[640px]:px-5">
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-sps-line bg-sps-white @[760px]:grid-cols-2">
        <section className="flex flex-col justify-center p-6 @[640px]:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-sps-green" />
          <h1 className="text-3xl font-semibold leading-tight">
            Start with a name.
          </h1>
          <p className={`mt-4 text-sm leading-6 ${kit.muted}`}>
            Create a project and start working in its Products thread. Add
            knowledge and files whenever you need them.
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
              Describe your products, attach useful files and work with the
              product assistant in one conversation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
