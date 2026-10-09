"use client";
import { useState } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import {
  TextField,
  Feedback,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { ThreadAgentSelect } from "../../../profile/singlepage/ai-chat-agent/index";
export interface IThreadCreateProps {
  onCancel: () => void;
}
export function Component({ onCancel }: IThreadCreateProps) {
  const [title, setTitle] = useState("");
  const [hasAgent, setHasAgent] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  return (
    <form
      data-ds-block="social.thread.ai-chat-create"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim() && hasAgent) setPreviewed(true);
      }}
      className="mx-auto grid w-full max-w-xl gap-5 overflow-y-auto p-5 @[640px]:p-8"
    >
      <p className={`text-sm leading-6 ${kit.muted}`}>
        Give this thread a name and choose an agent. The agent uses the
        project's knowledge.
      </p>
      <TextField
        label="Thread name"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setPreviewed(false);
        }}
        required
        maxLength={100}
        placeholder="What do you want to work on?"
      />
      <ThreadAgentSelect
        onChange={(selected) => {
          setHasAgent(selected);
          setPreviewed(false);
        }}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!title.trim() || !hasAgent}>
          <Icon name="chat-circle" />
          Create thread
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {previewed && <Feedback>Preview only. No thread was created.</Feedback>}
    </form>
  );
}
