"use client";
import { forwardRef as forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { twMerge as twMerge } from "tailwind-merge";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { useState } from "react";
import type { IProjectAgent } from "../../overview/ai-chat/resolver";
import {
  Component as AgentProfile,
  knowledgeAgent,
} from "../../overview/ai-chat/index";
import { Component as AgentAvatar } from "../../avatar/ai-chat/index";
interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
}
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IThreadAgentSelectProps {
  onChange: (selected: boolean) => void;
}
export function Component({ onChange }: IThreadAgentSelectProps) {
  const [agentId, setAgentId] = useState("");
  const [profile, setProfile] = useState<IProjectAgent | null>(null);
  return (
    <fieldset
      data-ds-block="social.profile.agent-select-ai-chat"
      className="min-w-0 space-y-3"
    >
      <legend className={kit.label}>Agent</legend>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            aria-label="Помощник в обсуждении"
            placeholder="Выберите помощника"
            value={agentId}
            onValueChange={(value) => {
              setAgentId(value);
              onChange(value === knowledgeAgent.id);
            }}
            options={[{ value: knowledgeAgent.id, label: knowledgeAgent.name }]}
          />
        </div>
        {agentId && (
          <AgentAvatar agent={knowledgeAgent} onSelect={setProfile} />
        )}
      </div>
      <p className="text-xs leading-5 text-[color:var(--workspace-brand-muted)]">
        {agentId
          ? knowledgeAgent.description
          : "Выберите помощника для этого обсуждения."}
      </p>
      <AgentProfile agent={profile} onClose={() => setProfile(null)} />
    </fieldset>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-[color:var(--workspace-brand-foreground)]/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-[color:var(--workspace-brand-muted)]",
  content:
    "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[color:var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};
// shadcn Select composition, themed with module tokens and Phosphor icons.
// https://ui.shadcn.com/docs/components/radix/select
export const Select = forwardRef<HTMLButtonElement, ISelectProps>(
  function Select(
    {
      id,
      className,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    return (
      <div className="min-w-0">
        <SelectPrimitive.Root {...props}>
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={twMerge(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {/* Keep fixed positioning outside CSS containers while retaining the project theme. */}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-workspace-projection="singlepage"
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={picker.content}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" className="rotate-180" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={picker.item}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Icon name="check" className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  },
);
