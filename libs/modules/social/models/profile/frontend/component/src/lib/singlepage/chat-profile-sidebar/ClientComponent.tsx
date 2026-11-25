"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, settingsFormStyles } from "@sps/shared-ui-shadcn";
import { Icon, type IconName } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { Component as Skill } from "@sps/social/models/skill/frontend/component";
import { resolveMcpServerConfiguration } from "@sps/social/models/profile/sdk/model";
import { getLocalizedPlainText } from "../plain-text";
import type { IClientComponentProps } from "./interface";

interface ISectionProps {
  icon: IconName;
  actionIcon: IconName;
  title: string;
  count?: number;
  actionLabel: string;
  onAction?: () => void;
  children: ReactNode;
}

function ProfileDescription({ text, ru }: { text: string; ru: boolean }) {
  const id = useId();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = paragraph.current;
    if (!element) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      setOverflows(element.offsetHeight > 6 * lineHeight + 0.5);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return (
    <>
      <div
        id={id}
        className={cn(
          "text-sm leading-6",
          !expanded && "max-h-[6lh] overflow-hidden",
        )}
      >
        <p
          ref={paragraph}
          className="whitespace-pre-line break-words text-muted-foreground"
        >
          {text}
        </p>
      </div>
      {overflows && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 py-1 text-foreground"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? ru
              ? "Свернуть"
              : "Show less"
            : ru
              ? "Подробнее"
              : "Read more"}
        </Button>
      )}
    </>
  );
}

function ProfileSection({
  icon,
  actionIcon,
  title,
  count,
  actionLabel,
  onAction,
  children,
}: ISectionProps) {
  return (
    <section className="space-y-2 border-t border-border px-5 py-4 sm:px-6">
      <div className="flex min-h-9 items-center gap-2">
        <Icon name={icon} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
        {onAction && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAction}
            aria-label={actionLabel}
            title={actionLabel}
            className="ml-auto size-11 shrink-0 rounded-xl border-border bg-card text-foreground hover:bg-muted"
          >
            <Icon name={actionIcon} />
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function Component(props: IClientComponentProps) {
  const ru = props.language === "ru";
  const title =
    (props.summaryOnly && props.displayName?.trim()) ||
    getLocalizedPlainText(props.data.title, props.language) ||
    props.data.adminTitle?.trim() ||
    props.data.slug;
  const subtitle = getLocalizedPlainText(props.data.subtitle, props.language);
  const description = getLocalizedPlainText(
    props.data.description,
    props.language,
  );
  const caption =
    props.profileCaption ?? (props.data.slug && `@${props.data.slug}`);
  const editName = props.profileCaption ? title : props.data.slug || title;
  const editProfile =
    !props.summaryOnly && props.onProfileEdit
      ? () => props.onProfileEdit?.(props.data)
      : undefined;
  const skills = props.skills || [];
  const knowledgeSources = props.knowledgeSources || [];
  const mcpServers = props.summaryOnly
    ? []
    : resolveMcpServerConfiguration(props.data.allowedMcpServerIds || [])
        .supported;
  const forProfile = (en: string, russian: string) =>
    ru
      ? `${russian} для профиля «${title}»`
      : `${en} for ${props.data.slug || title}`;
  const avatar = (
    <Profile
      isServer={false}
      variant="chat-profile-avatar"
      data={
        props.summaryOnly
          ? { id: props.data.id, title: { [props.language]: title } }
          : props.data
      }
      dataSource={
        props.summaryOnly || props.avatar !== undefined ? "props" : "api"
      }
      file={props.avatar}
      language={props.language}
      className="size-20 bg-secondary text-2xl font-semibold text-secondary-foreground ring-4 ring-card"
    />
  );

  return (
    <section
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant="chat-profile-sidebar"
      className={cn("min-w-0 bg-card text-foreground", props.className)}
    >
      <header className="relative">
        <div
          aria-hidden="true"
          className="relative h-24 overflow-hidden bg-primary sm:h-28"
        >
          <span className="absolute -right-10 -top-36 size-72 rounded-full border-[30px] border-primary-foreground/10" />
          <span className="absolute -right-24 -top-48 size-96 rounded-full border border-primary-foreground/20" />
        </div>
        <div className="relative grid gap-3 px-5 pb-5 sm:px-6">
          <div className="-mt-10 size-20">
            {editProfile ? (
              <button
                type="button"
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4"
                aria-label={`${ru ? "Изменить фото профиля" : "Edit profile photo"} ${editName}`}
                onClick={editProfile}
              >
                {avatar}
              </button>
            ) : (
              avatar
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className={cn(settingsFormStyles.title, "break-words")}>
                {title}
              </h2>
              {caption && (
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {caption}
                </p>
              )}
            </div>
            {editProfile && (
              <Button
                type="button"
                variant="outline"
                onClick={editProfile}
                aria-label={`${ru ? "Изменить профиль" : "Edit profile"} ${editName}`}
                className={cn(settingsFormStyles.secondary, "shrink-0")}
              >
                <Icon name="pencil-simple" />
                {ru ? "Изменить" : "Edit"}
              </Button>
            )}
          </div>
        </div>
        {props.onClose && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={props.onClose}
            aria-label={ru ? "Закрыть профиль" : "Close profile sidebar"}
            className="absolute right-4 top-4 size-11 rounded-xl border-border bg-card text-foreground shadow-sm hover:bg-muted"
          >
            <Icon name="x" />
          </Button>
        )}
      </header>

      {(subtitle || description) && (
        <section className="space-y-2 border-t border-border px-5 py-4 sm:px-6">
          <h3 className="text-sm font-semibold">
            {ru ? "О профиле" : "About"}
          </h3>
          {subtitle && (
            <p className="break-words text-sm leading-6">{subtitle}</p>
          )}
          {description && (
            <ProfileDescription
              key={props.data.id}
              text={description}
              ru={ru}
            />
          )}
        </section>
      )}

      {!props.summaryOnly && (
        <>
          <ProfileSection
            icon="gear-six"
            actionIcon="pencil-simple"
            title={ru ? "Инструменты MCP" : "MCP tools"}
            count={mcpServers.length}
            actionLabel={forProfile(
              "Edit MCP servers",
              "Настроить MCP-серверы",
            )}
            onAction={
              props.onMcpServersEdit &&
              (() => props.onMcpServersEdit?.(props.data))
            }
          >
            {mcpServers.length ? (
              <ul className="space-y-1.5">
                {mcpServers.map((server) => (
                  <li
                    key={server.id}
                    data-module="social"
                    data-model="mcp-server"
                    data-id={server.id}
                    data-variant="chat-sidebar-item"
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2"
                  >
                    <Icon name="gear-six" className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">
                        {server.title}
                      </p>
                      <p className="break-all text-xs text-muted-foreground">
                        {server.id}
                      </p>
                    </div>
                    {props.onMcpServersEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => props.onMcpServersEdit?.(props.data)}
                        aria-label={`${ru ? "Настроить" : "Configure"} ${server.title}`}
                        className="size-11 shrink-0 rounded-xl hover:bg-muted"
                      >
                        <Icon name="pencil-simple" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru ? "MCP-серверы не подключены." : "No MCP servers."}
              </p>
            )}
          </ProfileSection>

          <ProfileSection
            icon="package"
            actionIcon="plus"
            title={ru ? "Навыки" : "Skills"}
            count={props.isSkillsLoading ? undefined : skills.length}
            actionLabel={forProfile("New skill", "Добавить навык")}
            onAction={
              props.onSkillCreate && (() => props.onSkillCreate?.(props.data))
            }
          >
            {props.isSkillsLoading ? (
              <p role="status" className="text-sm text-muted-foreground">
                {ru ? "Загружаем навыки…" : "Loading skills…"}
              </p>
            ) : skills.length ? (
              <div className="space-y-1.5">
                {skills.map((skill) => (
                  <Skill
                    key={skill.id}
                    isServer={false}
                    variant="chat-sidebar-item"
                    dataSource="props"
                    data={skill}
                    language={props.language}
                    onSelect={props.onSkillEdit}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {ru ? "Нет связанных навыков." : "No linked skills."}
              </p>
            )}
          </ProfileSection>
        </>
      )}
      {(!props.summaryOnly || props.onKnowledgeSourceSelect) && (
        <ProfileSection
          icon="file-text"
          actionIcon="plus"
          title={ru ? "Знания" : "Knowledge"}
          count={
            props.isKnowledgeSourcesLoading || props.hasKnowledgeSourcesError
              ? undefined
              : knowledgeSources.length
          }
          actionLabel={forProfile("New knowledge", "Добавить источник знаний")}
          onAction={
            props.onKnowledgeSourceCreate &&
            (() => props.onKnowledgeSourceCreate?.(props.data))
          }
        >
          {props.isKnowledgeSourcesLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              {ru ? "Загружаем источники знаний…" : "Loading knowledge…"}
            </p>
          ) : props.hasKnowledgeSourcesError ? (
            <p role="alert" className="text-sm text-destructive">
              {ru
                ? "Не удалось загрузить источники знаний."
                : "Knowledge could not be loaded."}
            </p>
          ) : knowledgeSources.length ? (
            <div className="space-y-1.5">
              {knowledgeSources.map((source) => (
                <KnowledgeModuleSource
                  key={source.id}
                  isServer={false}
                  variant="chat-sidebar-item"
                  dataSource="props"
                  data={source}
                  language={props.language}
                  isSelected={props.selectedKnowledgeSource?.id === source.id}
                  onSelect={props.onKnowledgeSourceSelect}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {ru ? "Нет источников знаний." : "No knowledge sources."}
            </p>
          )}
        </ProfileSection>
      )}
    </section>
  );
}
