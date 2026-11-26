"use client";

import {
  resolveMcpServerConfiguration,
  setMcpServerEnabled,
  supportedMcpServerDescriptors,
  type IModel as ISocialModuleProfile,
  type TSupportedMcpServerIdentifier,
} from "@sps/social/models/profile/sdk/model";
import {
  Badge,
  Checkbox,
  Dialog,
  SettingsDialogContent,
  SettingsDialogHeader,
  settingsFormStyles,
  Label,
} from "@sps/shared-ui-shadcn";
import { Save, ServerCog } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

interface McpServersDialogProps {
  language?: string;
  isOpen: boolean;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (allowedMcpServerIds: TSupportedMcpServerIdentifier[]) => void;
  profile: ISocialModuleProfile | null;
}

export function McpServersDialog(props: McpServersDialogProps) {
  const ru = props.language === "ru";
  const [configuredServerIds, setConfiguredServerIds] = useState<
    TSupportedMcpServerIdentifier[]
  >([]);

  useEffect(() => {
    if (!props.isOpen || !props.profile) {
      return;
    }

    setConfiguredServerIds(
      resolveMcpServerConfiguration(
        props.profile.allowedMcpServerIds || [],
      ).supported.map((server) => server.id),
    );
  }, [props.isOpen, props.profile]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSave(configuredServerIds);
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SettingsDialogContent closeLabel={ru ? "Закрыть" : "Close"}>
        <SettingsDialogHeader
          title={ru ? "Настройки серверов MCP" : "Edit MCP Servers"}
          description={
            ru
              ? "Выберите серверы MCP, которые ассистент может использовать в чате."
              : "Choose which MCP servers this assistant can use in chat."
          }
        />
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            {supportedMcpServerDescriptors.map((server) => {
              const inputId = `profile-mcp-server-${server.id}`;
              const isEnabled = configuredServerIds.includes(server.id);

              return (
                <div
                  key={server.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <Checkbox
                    id={inputId}
                    disabled={props.isSaving}
                    checked={isEnabled}
                    onCheckedChange={(checked) => {
                      setConfiguredServerIds((current) => {
                        return setMcpServerEnabled(
                          current,
                          server.id,
                          checked === true,
                        );
                      });
                    }}
                  />
                  <ServerCog className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label htmlFor={inputId}>{server.title}</Label>
                      <Badge variant="outline">{server.id}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {ru && server.id === "singlepagestartup"
                        ? "Локальный сервер MCP для этой установки SinglePageStartup."
                        : server.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={props.isSaving}
              className={settingsFormStyles.primary}
            >
              <Save className="size-4" />
              {props.isSaving
                ? ru
                  ? "Сохраняем…"
                  : "Saving…"
                : ru
                  ? "Сохранить"
                  : "Save"}
            </button>
          </div>
        </form>
      </SettingsDialogContent>
    </Dialog>
  );
}
