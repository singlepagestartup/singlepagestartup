"use client";

import { api, Provider } from "@sps/rbac/models/subject/sdk/client";
import { Button, Card } from "@sps/shared-ui-shadcn";
import { copy } from "./data";

interface ISettingsPageProps {
  language: string;
}

function Maintenance(props: ISettingsPageProps) {
  const text = props.language === "ru" ? copy.ru : copy.en;
  const revalidate = api.hostCacheRevalidate();

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <section
        data-testid="settings-page"
        className="mx-auto max-w-7xl space-y-4"
      >
        <h1 className="text-3xl font-bold">{text.settings}</h1>
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
      </section>
    </main>
  );
}

export function Component(props: ISettingsPageProps) {
  return (
    <Provider>
      <Maintenance language={props.language} />
    </Provider>
  );
}
