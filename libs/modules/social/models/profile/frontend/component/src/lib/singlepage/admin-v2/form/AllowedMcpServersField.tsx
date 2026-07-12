"use client";

import {
  insertSchema,
  resolveMcpServerConfiguration,
  setMcpServerEnabled,
  supportedMcpServerDescriptors,
} from "@sps/social/models/profile/sdk/model";
import { Badge, Checkbox, Label } from "@sps/shared-ui-shadcn";
import { type Control, useController } from "react-hook-form";
import { z } from "zod";

export interface IAllowedMcpServersFieldProps {
  control: Control<z.infer<typeof insertSchema>>;
  storedIdentifiers?: readonly string[];
}

export function AllowedMcpServersField(props: IAllowedMcpServersFieldProps) {
  const { field } = useController({
    control: props.control,
    name: "allowedMcpServerIds",
  });
  const configuredIdentifiers = Array.isArray(field.value) ? field.value : [];
  const configuration = resolveMcpServerConfiguration(configuredIdentifiers);
  const storedConfiguration = resolveMcpServerConfiguration(
    props.storedIdentifiers ?? configuredIdentifiers,
  );
  const enabledIdentifiers = new Set(
    configuration.supported.map((descriptor) => descriptor.id),
  );

  return (
    <section
      aria-labelledby="allowed-mcp-servers-title"
      className="space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-4"
    >
      <div className="space-y-1">
        <h3 id="allowed-mcp-servers-title" className="text-sm font-medium">
          Allowed MCP servers
        </h3>
        <p className="text-sm text-muted-foreground">
          Servers this AI profile may use while completing chat tasks.
        </p>
      </div>

      <div className="space-y-2">
        {supportedMcpServerDescriptors.map((descriptor) => {
          const inputId = `allowed-mcp-server-${descriptor.id}`;

          return (
            <div
              key={descriptor.id}
              className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3"
            >
              <Checkbox
                id={inputId}
                checked={enabledIdentifiers.has(descriptor.id)}
                onCheckedChange={(checked) => {
                  field.onChange(
                    setMcpServerEnabled(
                      configuredIdentifiers,
                      descriptor.id,
                      checked === true,
                    ),
                  );
                }}
                onBlur={field.onBlur}
                ref={field.ref}
              />
              <div className="space-y-1">
                <Label htmlFor={inputId}>{descriptor.title}</Label>
                <p className="text-sm text-muted-foreground">
                  {descriptor.description}
                </p>
              </div>
            </div>
          );
        })}

        {storedConfiguration.stale.map((identifier) => (
          <div
            key={identifier}
            className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3"
          >
            <Checkbox checked disabled aria-label={identifier} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{identifier}</span>
                <Badge variant="outline">Unavailable</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                This stored MCP server is not supported by the current project.
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
