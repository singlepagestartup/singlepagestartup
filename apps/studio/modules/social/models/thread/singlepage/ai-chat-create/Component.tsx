"use client";
import { useState } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { TextField } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
export interface IThreadCreateProps {
  onCreate: (title: string) => void;
}
export function Component({ onCreate }: IThreadCreateProps) {
  const [title, setTitle] = useState("");
  return (
    <form
      data-ds-block="social.thread.ai-chat-create"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim()) onCreate(title.trim());
      }}
      className="mx-auto grid w-full max-w-xl gap-5 overflow-y-auto p-5 @[640px]:p-8"
    >
      <p className={`text-sm leading-6 ${kit.muted}`}>
        This thread uses the project's knowledge. Give it a name to start a
        conversation.
      </p>
      <TextField
        label="Thread name"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        maxLength={100}
        placeholder="What do you want to work on?"
      />
      <Button type="submit" disabled={!title.trim()}>
        <Icon name="chat-circle" />
        Create thread
      </Button>
    </form>
  );
}
