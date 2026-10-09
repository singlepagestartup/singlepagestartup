"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEvent } from "react";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { MarkdownDocument } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
import { TextField } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import {
  AI_CHAT_AGENTS,
  type IProjectAgent,
} from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";

import {
  Component as ProductsSkill,
  productsSkill,
} from "../../../skill/singlepage/ai-chat-products/index";
export const productsAgent: IProjectAgent = {
  id: "products-agent",
  name: "Product assistant",
  description: "Works with the project's Products knowledge.",
  role: productsSkill.description,
};

export interface IAgentProfileProps {
  agent: IProjectAgent | null;
  onClose: () => void;
}
export interface IAgentAvatarProps {
  agent: IProjectAgent;
  onSelect: (agent: IProjectAgent) => void;
}
export interface IAgentPickerProps {
  agent: IProjectAgent | null;
  agents: IProjectAgent[];
  onChange: (agent: IProjectAgent | null) => void;
  onSave: (agent: IProjectAgent) => void;
}
export interface IThreadAgentSelectProps {
  onChange: (selected: boolean) => void;
}

export function ThreadAgentSelect({ onChange }: IThreadAgentSelectProps) {
  const [agentId, setAgentId] = useState("");
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className={kit.label}>Agent</legend>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            aria-label="Thread agent"
            placeholder="Select an agent"
            value={agentId}
            onValueChange={(value) => {
              setAgentId(value);
              onChange(value === productsAgent.id);
            }}
            options={[{ value: productsAgent.id, label: productsAgent.name }]}
          />
        </div>
        {agentId && (
          <ProjectAgentAvatar agent={productsAgent} onSelect={setProfile} />
        )}
      </div>
      <p className="text-xs leading-5 text-sps-muted">
        {agentId
          ? productsAgent.description
          : "Choose the agent for this conversation."}
      </p>
      <Component agent={profile} onClose={() => setProfile(null)} />
    </fieldset>
  );
}

export function ProjectAgentAvatar({ agent, onSelect }: IAgentAvatarProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(agent)}
      aria-label={`About ${agent.name}`}
      title={`About ${agent.name}`}
      className={`grid size-8 shrink-0 place-items-center rounded-lg bg-sps-green text-sps-graphite transition hover:bg-sps-green/80 ${kit.focus}`}
    >
      <Icon name="robot" className="size-4" />
    </button>
  );
}

export function Component({ agent, onClose }: IAgentProfileProps) {
  return (
    <Dialog.Root
      open={Boolean(agent)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-sps-graphite/40" />
        <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-xl focus:outline-none">
          <div className="shrink-0 border-b border-sps-line p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sps-green">
                <Icon name="robot" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-semibold">
                  {agent?.name}
                </Dialog.Title>
                <p className="mt-1 text-xs text-sps-muted">
                  {agent?.custom ? "Custom agent" : "Preset agent"}
                </p>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="plain"
                  className="min-h-9 px-2"
                  aria-label="Close agent profile"
                >
                  <Icon name="x" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-4 text-sm leading-6 text-sps-muted">
              {agent?.description}
            </Dialog.Description>
          </div>
          <div className="min-h-0 overflow-y-auto p-5">
            {agent?.id === productsAgent.id ? (
              <ProductsSkill />
            ) : (
              <MarkdownDocument hideTitle>{agent?.role ?? ""}</MarkdownDocument>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProjectAgentPicker({
  agent,
  agents,
  onChange,
  onSave,
}: IAgentPickerProps) {
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<IProjectAgent | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const available = [...AI_CHAT_AGENTS, ...agents];
  function openEditor(value: IProjectAgent | null) {
    setDraft(value?.custom ? value : null);
    setName(
      value ? (value.custom ? value.name : `${value.name} — custom`) : "",
    );
    setDescription(value?.description ?? "");
    setRole(value?.role ?? "");
    setEditing(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!name.trim() || !description.trim() || !role.trim()) return;
    const next: IProjectAgent = {
      id: draft?.id ?? `custom-${crypto.randomUUID()}`,
      custom: true,
      name: name.trim(),
      description: description.trim(),
      role: role.trim(),
    };
    onSave(next);
    onChange(next);
    setEditing(false);
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            aria-label="Thread agent"
            value={agent?.id ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                onChange(null);
                return;
              }
              const next = available.find((item) => item.id === value);
              if (next) onChange(next);
            }}
            options={[
              { value: "none", label: "No agent" },
              ...available.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
        </div>
        {agent && <ProjectAgentAvatar agent={agent} onSelect={setProfile} />}
      </div>
      <p className="text-xs leading-5 text-sps-muted">
        {agent?.description ??
          "Use the selected model with attached documents, without a preset or custom role."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="plain"
          className="min-h-9 px-2 text-xs"
          onClick={() => openEditor(null)}
        >
          <Icon name="plus" className="size-4" />
          Create your own agent
        </Button>
        {agent && (
          <Button
            variant="plain"
            className="min-h-9 px-2 text-xs"
            onClick={() => openEditor(agent)}
          >
            <Icon name="gear-six" className="size-4" />
            {agent.custom ? "Edit agent" : "Customize role"}
          </Button>
        )}
      </div>
      <Component agent={profile} onClose={() => setProfile(null)} />
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-sps-graphite/40" />
          <Dialog.Content className="fixed inset-y-4 right-4 z-50 flex w-[calc(100%-32px)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-sps-line bg-sps-white font-sps text-sps-graphite shadow-xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b border-sps-line p-5">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {draft ? "Edit agent" : "Create your own agent"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-sps-muted">
                  Define its responsibility, method and boundaries. Project
                  context comes from the documents attached to the thread.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="plain"
                  className="min-h-9 px-2"
                  aria-label="Close agent editor"
                >
                  <Icon name="x" />
                </Button>
              </Dialog.Close>
            </div>
            <form onSubmit={save} className="space-y-5 overflow-y-auto p-5">
              <TextField
                label="Agent name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
              />
              <label className="block">
                <span className={`${kit.label} mb-2 block`}>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={3}
                  className={kit.field}
                />
              </label>
              <label className="block">
                <span className={`${kit.label} mb-2 block`}>Role</span>
                <textarea
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  required
                  rows={16}
                  className={`${kit.field} font-mono`}
                  placeholder="Describe the mission, method, boundaries and expected result."
                />
              </label>
              <Button
                type="submit"
                disabled={!name.trim() || !description.trim() || !role.trim()}
              >
                <Icon name="floppy-disk" />
                Save agent
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
