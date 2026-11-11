"use client";

import { api, Provider } from "@sps/rbac/models/subject/sdk/client";
import { Button, Card, Textarea } from "@sps/shared-ui-shadcn";
import { useState } from "react";
import { copy } from "./data";
import type { ISettingsPageProps, ITemplateExampleProps } from "./interface";

function Maintenance(props: ISettingsPageProps) {
  const text = props.language === "ru" ? copy.ru : copy.en;
  const revalidate = api.hostCacheRevalidate();

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-xl font-semibold">{text.title}</h2>
      <p className="text-sm text-muted-foreground">{text.description}</p>
      <Button
        type="button"
        disabled={revalidate.isPending}
        onClick={() => revalidate.mutate()}
      >
        {revalidate.isPending ? text.pending : text.action}
      </Button>
      {revalidate.isSuccess && <p role="status">{text.success}</p>}
      {revalidate.isError && (
        <p role="alert" className="text-sm text-destructive">
          {revalidate.error.message}
        </p>
      )}
    </Card>
  );
}

export function TemplateExample(props: ITemplateExampleProps) {
  const text = props.language === "ru" ? copy.ru : copy.en;
  const [status, setStatus] = useState("");

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(props.content);
      setStatus(text.copied);
    } catch {
      setStatus(text.copyFailed);
    }
  }

  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">
        {text.example}
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-muted-foreground">
          {text.exampleDescription}
        </p>
        <Textarea
          aria-label={text.example}
          value={props.content}
          readOnly
          className="min-h-52 font-mono text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={copyContent}>
          {text.copy}
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      </div>
    </details>
  );
}

export function Component(props: ISettingsPageProps) {
  return (
    <Provider>
      <Maintenance language={props.language} />
    </Provider>
  );
}
