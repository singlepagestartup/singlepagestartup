"use client";

import { useState } from "react";
import type { IPermissionDefault } from "@sps/rbac/models/subject/sdk/model";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/client";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shared-ui-shadcn";
import { copy } from "./data";
import type { ISettingsPageProps } from "./interface";

function label(row: IPermissionDefault) {
  return row.method + " " + row.path;
}

function Picker(props: ISettingsPageProps) {
  const text = props.language === "ru" ? copy.ru : copy.en;
  const catalog = subjectApi.permissionDefaults();
  const create = permissionApi.create();
  const [module, setModule] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rows = catalog.data ?? [];
  const modules = Array.from(
    new Set(rows.map((row) => row.path.split("/")[2])),
  ).sort();
  const visible = rows.filter(
    (row) =>
      row.path.split("/")[2] === module &&
      label(row).toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function apply() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const current = await catalog.refetch({ throwOnError: true });
      const available = new Map(current.data?.map((row) => [label(row), row]));
      for (const key of selected) {
        const row = available.get(key);
        if (!row) {
          throw new Error(text.permissionsChanged);
        }
        if (!row.configured) {
          try {
            await create.mutateAsync({
              data: { type: row.type, method: row.method, path: row.path },
            });
          } catch (cause) {
            const latest = await catalog.refetch({ throwOnError: true });
            // Another administrator may have created this permission since we checked.
            if (
              !latest.data?.some(
                (item) => label(item) === key && item.configured,
              )
            ) {
              throw cause;
            }
          }
        }
        setSelected((remaining) => remaining.filter((item) => item !== key));
      }
      await catalog.refetch({ throwOnError: true });
      setSelected([]);
      setMessage(text.permissionsSaved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.permissionsFailed);
      const refreshed = await catalog.refetch();
      if (refreshed.data) {
        const missing = new Set(
          refreshed.data.filter((row) => !row.configured).map(label),
        );
        setSelected((remaining) => remaining.filter((key) => missing.has(key)));
      }
    } finally {
      setSaving(false);
    }
  }

  if (catalog.isPending) {
    return <p role="status">{text.permissionsLoading}</p>;
  }
  if (catalog.isError) {
    return (
      <div className="space-y-2">
        <p role="alert">{catalog.error.message}</p>
        <Button variant="outline" onClick={() => void catalog.refetch()}>
          {text.retry}
        </Button>
      </div>
    );
  }
  if (!rows.length) {
    return <p role="status">{text.permissionsEmpty}</p>;
  }

  return (
    <div className="space-y-3">
      <Select value={module} onValueChange={setModule} disabled={saving}>
        <SelectTrigger aria-label={text.module}>
          <SelectValue placeholder={text.module} />
        </SelectTrigger>
        <SelectContent>
          {modules.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {module && (
        <>
          <Input
            aria-label={text.searchPermissions}
            placeholder={text.searchPermissions}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
            {visible.map((row) => {
              const key = label(row);
              return (
                <li key={key}>
                  <label className="flex items-start gap-2 p-1">
                    <Checkbox
                      aria-label={key}
                      disabled={row.configured || saving}
                      checked={row.configured || selected.includes(key)}
                      onCheckedChange={(checked) => {
                        setMessage("");
                        setError("");
                        setSelected((current) =>
                          checked === true
                            ? [...current, key]
                            : current.filter((item) => item !== key),
                        );
                      }}
                    />
                    <span className="break-all font-mono text-xs">{key}</span>
                    {row.configured && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {text.configured}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
            {!visible.length && (
              <li className="text-sm text-muted-foreground">
                {text.noMatches}
              </li>
            )}
          </ul>
        </>
      )}
      <Button
        type="button"
        disabled={saving || selected.length === 0}
        onClick={apply}
      >
        {saving ? text.permissionsSaving : text.createSelected} (
        {selected.length})
      </Button>
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function PermissionDefaults(props: ISettingsPageProps) {
  const text = props.language === "ru" ? copy.ru : copy.en;
  const [open, setOpen] = useState(false);
  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-xl font-semibold">{text.permissionsTitle}</h2>
      <p className="text-sm text-muted-foreground">
        {text.permissionsDescription}
      </p>
      {open ? (
        <Picker {...props} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {text.choosePermissions}
        </Button>
      )}
    </Card>
  );
}
