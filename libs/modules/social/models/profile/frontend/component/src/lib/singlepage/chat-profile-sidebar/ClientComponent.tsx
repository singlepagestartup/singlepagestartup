"use client";

import { IClientComponentProps } from "./interface";
import { getLocalizedPlainText } from "../plain-text";
import { cn } from "@sps/shared-frontend-client-utils";
import { ScrollArea } from "@sps/shared-ui-shadcn";
import { Component as KnowledgeModuleDocumentChatSidebarItem } from "@sps/knowledge/models/document/frontend/component/src/lib/singlepage/chat-sidebar-item";
import { Component as SocialModuleProfileChatProfileAvatar } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar";
import { Component as SocialModuleSkillChatSidebarItem } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-sidebar-item";
import { BookOpen, Package, Pencil, Plus, UserRound, X } from "lucide-react";

function getLocalizedText(
  value: Record<string, unknown> | null | undefined,
  language: string,
) {
  const localized = value?.[language];

  if (typeof localized === "string") {
    return localized;
  }

  return "";
}

function getProfileTitle(props: IClientComponentProps) {
  return (
    getLocalizedText(props.data.title, props.language) ||
    props.data.adminTitle ||
    props.data.slug
  );
}

export function Component(props: IClientComponentProps) {
  const title = getProfileTitle(props);
  const subtitle = getLocalizedText(props.data.subtitle, props.language);
  const description = getLocalizedPlainText(
    props.data.description,
    props.language,
  );
  const skills = props.skills || [];
  const knowledgeDocuments = props.knowledgeDocuments || [];

  return (
    <section
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant="chat-profile-sidebar"
      className={cn("flex h-full min-h-0 flex-col bg-white", props.className)}
    >
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-start gap-3">
          {props.onProfileEdit ? (
            <button
              type="button"
              className="shrink-0 rounded-full outline-none ring-offset-2 transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label={`Edit profile photo ${props.data.slug}`}
              title="Edit profile photo"
              onClick={() => {
                props.onProfileEdit?.(props.data);
              }}
            >
              <SocialModuleProfileChatProfileAvatar
                isServer={props.isServer}
                variant="chat-profile-avatar"
                data={props.data}
                language={props.language}
                className="h-10 w-10 text-sm"
              />
            </button>
          ) : (
            <SocialModuleProfileChatProfileAvatar
              isServer={props.isServer}
              variant="chat-profile-avatar"
              data={props.data}
              language={props.language}
              className="h-10 w-10 text-sm"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-slate-950">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              @{props.data.slug}
            </p>
          </div>
          {props.onClose ? (
            <button
              type="button"
              onClick={props.onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close profile sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                  Profile
                </h3>
              </div>
              {props.onProfileEdit ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`Edit profile ${props.data.slug}`}
                  title="Edit profile"
                  onClick={() => {
                    props.onProfileEdit?.(props.data);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {subtitle ? (
              <p className="text-xs leading-5 text-slate-600">{subtitle}</p>
            ) : null}
            {description ? (
              <p className="whitespace-pre-line text-xs leading-5 text-slate-600">
                {description}
              </p>
            ) : (
              <p className="text-xs leading-5 text-slate-400">
                No profile description.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                  Skills
                </h3>
                {!props.isSkillsLoading ? (
                  <span className="text-xs text-slate-400">
                    {skills.length}
                  </span>
                ) : null}
              </div>
              {props.onSkillCreate ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`New skill for ${props.data.slug}`}
                  title="New skill"
                  onClick={() => {
                    props.onSkillCreate?.(props.data);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {props.isSkillsLoading ? (
              <p className="text-sm text-slate-400">Loading skills...</p>
            ) : skills.length ? (
              <div className="space-y-1">
                {skills.map((skill) => {
                  return (
                    <SocialModuleSkillChatSidebarItem
                      key={skill.id}
                      isServer={false}
                      variant="chat-sidebar-item"
                      data={skill}
                      language={props.language}
                      onSelect={props.onSkillEdit}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No linked skills.</p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                  Knowledge
                </h3>
                {!props.isKnowledgeDocumentsLoading ? (
                  <span className="text-xs text-slate-400">
                    {knowledgeDocuments.length}
                  </span>
                ) : null}
              </div>
              {props.onKnowledgeDocumentCreate ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`New knowledge for ${props.data.slug}`}
                  title="New knowledge"
                  onClick={() => {
                    props.onKnowledgeDocumentCreate?.(props.data);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {props.isKnowledgeDocumentsLoading ? (
              <p className="text-sm text-slate-400">Loading knowledge...</p>
            ) : knowledgeDocuments.length ? (
              <div className="space-y-1">
                {knowledgeDocuments.map((document) => {
                  return (
                    <KnowledgeModuleDocumentChatSidebarItem
                      key={document.id}
                      isServer={false}
                      variant="chat-sidebar-item"
                      data={document}
                      language={props.language}
                      isSelected={
                        props.selectedKnowledgeDocument?.id === document.id
                      }
                      onSelect={props.onKnowledgeDocumentSelect}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No knowledge documents.</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </section>
  );
}
