"use client";
import { useState } from "react";
import { useProfiles } from "../ai-chat-project/Profiles";
import { Button } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  TextField,
  Feedback,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { Component as KnowledgeModuleSource } from "../../../../knowledge/source";
export interface IProfileSettingsProps {
  profileId: string;
}
export function Component({ profileId }: IProfileSettingsProps) {
  const { projects, rename } = useProfiles();
  const profile = projects.find((record) => record.id === profileId);
  const [name, setName] = useState(profile?.name ?? "");
  const [saved, setSaved] = useState(false);
  if (!profile) return <p role="status">Project profile unavailable.</p>;
  return (
    <div
      data-ds-block="social.profile.ai-chat-settings"
      className="space-y-6 p-5"
    >
      <form
        className="flex max-w-xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          rename(profileId, name.trim());
          setSaved(true);
        }}
      >
        <div className="min-w-0 flex-1">
          <TextField
            label="Project name"
            value={name}
            className="mt-2"
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || name.trim() === profile.name}
        >
          Save name
        </Button>
      </form>
      {saved && <Feedback>Project name saved.</Feedback>}
      <div className="border-t border-sps-line pt-5">
        <KnowledgeModuleSource
          variant="ai-chat-download"
          label="Export Products.md"
        />
      </div>
    </div>
  );
}
