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
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
} from "@sps/shared-ui-shadcn";
import { Save, ServerCog } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

interface McpServersDialogProps {
  isOpen: boolean;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (allowedMcpServerIds: TSupportedMcpServerIdentifier[]) => void;
  profile: ISocialModuleProfile | null;
}

export function McpServersDialog(props: McpServersDialogProps) {
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
      <DialogContent className="z-[70] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit MCP Servers</DialogTitle>
          <DialogDescription>
            Choose which MCP servers this AI profile may use in chat.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            {supportedMcpServerDescriptors.map((server) => {
              const inputId = `profile-mcp-server-${server.id}`;
              const isEnabled = configuredServerIds.includes(server.id);

              return (
                <div
                  key={server.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <Checkbox
                    id={inputId}
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
                  <ServerCog className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label htmlFor={inputId}>{server.title}</Label>
                      <Badge variant="outline">{server.id}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {server.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={props.isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
