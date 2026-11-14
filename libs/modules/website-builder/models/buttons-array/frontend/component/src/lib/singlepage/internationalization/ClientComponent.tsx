"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { internationalization } from "@sps/shared-configuration";
import {
  cn,
  getLanguageSwitchHref,
  trackAnalyticsEvent,
} from "@sps/shared-frontend-client-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sps/shared-ui-shadcn";
import { variant, type IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const router = useRouter();
  const alternatives = internationalization.languages.filter(
    (language) => language.code !== props.language,
  );
  if (!alternatives.length) {
    return null;
  }

  function switchLanguage(language: string) {
    const href = getLanguageSwitchHref(window.location, language);
    trackAnalyticsEvent({
      name: "website_builder_language_switch",
      metadata: { id: props.id, from: props.language, to: language },
    });
    router.push(href, { scroll: false });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-module="website-builder"
        data-model="buttons-array"
        data-id={props.id}
        data-variant={variant}
        className={cn(
          "group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground data-[state=open]:bg-muted",
          props.className,
        )}
      >
        <Globe aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className="sr-only">{props.label}</span>
        {props.language.toUpperCase()}
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-36 rounded-xl border-border bg-card p-1 text-foreground"
      >
        {alternatives.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => switchLanguage(language.code)}
            className="min-h-10 cursor-pointer justify-between gap-4 rounded-lg px-3 font-medium focus:bg-muted focus:text-foreground"
          >
            {language.title}
            <span aria-hidden="true" className="text-xs text-muted-foreground">
              {language.code.toUpperCase()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
