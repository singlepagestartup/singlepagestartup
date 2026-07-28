import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  type IModel as ISocialModuleProfile,
  supportedMcpServerDescriptors,
} from "@sps/social/models/profile/sdk/model";
import type { IModel as IRbacModuleSubject } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import type {
  ITelegramConversationKey,
  ITelegramConversationRuntime,
  ITelegramConversationState,
  TTelegramAssistantPage,
} from "./telegram-conversation";

const pageSize = 6;
const inlineEditorValueMaxLength = 4_000;
const knowledgeContentMaxLength = 1_000_000;
const knowledgeTextFileExtensions = new Set([
  "csv",
  "json",
  "log",
  "markdown",
  "md",
  "txt",
  "xml",
  "yaml",
  "yml",
]);

export interface ITelegramAssistantMessageData {
  description: string;
  files?: File[];
  presentationMediaUrl?: string;
  interaction?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        callback_data?: string;
        url?: string;
      }>
    >;
  };
}

export interface ITelegramAssistantConversationContext {
  key: ITelegramConversationKey;
  requesterSubject: IRbacModuleSubject;
  requesterProfileId: string;
  socialModuleChatId: string;
  requesterJwtToken: string;
}

export interface ITelegramAssistantConversationTransport {
  create(
    data: ITelegramAssistantMessageData,
  ): Promise<{ id?: string; sourceSystemId?: string | null }>;
  update(
    socialModuleMessageId: string,
    data: ITelegramAssistantMessageData,
  ): Promise<unknown>;
  resolveProfileAvatar(
    profileId: string,
  ): Promise<
    { url: string; alt?: string; file?: File; isDefault?: boolean } | undefined
  >;
  resolveEditorFile(message: ISocialModuleMessage): Promise<File | undefined>;
}

type TNotice = { kind: "success" | "error" | "info"; text: string };

type TTransitionOutcome = {
  notice?: TNotice;
  close?: boolean;
  textFile?: {
    caption: string;
    file: File;
  };
};

export class TelegramAssistantConversation {
  constructor(readonly runtime: ITelegramConversationRuntime) {}

  async enter(
    context: ITelegramAssistantConversationContext,
    transport: ITelegramAssistantConversationTransport,
  ) {
    const profiles = await this.manageableProfiles(context);

    if (!profiles.length) {
      return transport.create({
        description:
          "В этом чате нет доступного AI-ассистента. Добавьте AI-профиль в участники чата и повторите /assistant.",
      });
    }

    const state = await this.runtime.start(context.key, {
      page: profiles.length === 1 ? "home" : "selector",
      selectedProfileId: profiles.length === 1 ? profiles[0].id : undefined,
    });

    return this.render(context, state, transport, {
      kind: "info",
      text:
        profiles.length === 1
          ? "Профиль ассистента открыт."
          : "Выберите AI-ассистента.",
    });
  }

  async terminate(
    context: ITelegramAssistantConversationContext,
    transport: ITelegramAssistantConversationTransport,
  ) {
    const state = await this.runtime.get(context.key);

    if (!state) {
      return transport.create({
        description:
          "Активного диалога управления нет. Запустите его командой /assistant.",
      });
    }

    if (state.presentationMessageId) {
      await transport
        .update(state.presentationMessageId, {
          description:
            "Управление AI-ассистентом завершено. Для нового диалога используйте /assistant.",
          interaction: { inline_keyboard: [] },
        })
        .catch(() => undefined);
    }

    await this.runtime.terminate(context.key);

    return true;
  }

  async handleCallback(
    context: ITelegramAssistantConversationContext,
    callbackData: string,
    transport: ITelegramAssistantConversationTransport,
  ) {
    let notice: TNotice | undefined;
    let shouldClose = false;
    let textFile: TTransitionOutcome["textFile"];

    try {
      const result = await this.runtime.consumeCallback(
        context.key,
        callbackData,
        async (state, callback) => {
          const outcome = await this.transition(context, state, {
            action: callback.action,
            token: callback.token,
          });
          notice = outcome.notice;
          shouldClose = Boolean(outcome.close);
          textFile = outcome.textFile;
        },
      );

      if (result.status !== "ok") {
        return transport.create({
          description:
            result.status === "invalid"
              ? "Некорректная кнопка. Откройте актуальное меню через /assistant."
              : "Это меню устарело или диалог завершён. Откройте новое через /assistant.",
        });
      }

      if (shouldClose) {
        return this.terminate(context, transport);
      }

      if (textFile) {
        await transport.create({
          description: textFile.caption,
          files: [textFile.file],
        });
      }

      return this.render(context, result.state, transport, notice);
    } catch (error) {
      const state = await this.runtime.get(context.key);
      const message = this.errorMessage(error);

      if (!state) {
        return transport.create({ description: message });
      }

      return this.render(context, state, transport, {
        kind: "error",
        text: message,
      });
    }
  }

  async handleMessage(
    context: ITelegramAssistantConversationContext,
    message: ISocialModuleMessage,
    transport: ITelegramAssistantConversationTransport,
  ) {
    const current = await this.runtime.get(context.key);

    if (!current) {
      return false;
    }

    if (!current.editor) {
      return false;
    }

    try {
      const next = await this.runtime.update(context.key, async (state) => {
        await this.consumeEditorInput(context, state, message, transport);
      });

      if (next) {
        await this.render(context, next, transport, {
          kind: "success",
          text: next.editor ? "Значение принято." : "Изменения сохранены.",
        });
      }
    } catch (error) {
      const state = await this.runtime.get(context.key);

      if (state) {
        await this.render(context, state, transport, {
          kind: "error",
          text: this.errorMessage(error),
        });
      }
    }

    return true;
  }

  protected async transition(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    input: { action: string; token?: string },
  ): Promise<TTransitionOutcome> {
    const navigate = (page: TTelegramAssistantPage) => {
      state.page = page;
      state.editor = undefined;
      state.confirmation = undefined;
      state.selectedEntityId = undefined;
    };

    switch (input.action) {
      case "close":
        return { close: true };
      case "refresh":
        return { notice: { kind: "info", text: "Данные обновлены." } };
      case "select": {
        const profile = await this.requireManageableProfileByToken(
          context,
          input.token,
        );
        state.selectedProfileId = profile.id;
        navigate("home");
        return {};
      }
      case "selector":
        state.selectedProfileId = undefined;
        navigate("selector");
        return {};
      case "profiles_prev":
      case "profiles_next": {
        const delta = input.action.endsWith("next") ? 1 : -1;
        state.pagination.profiles = Math.max(
          0,
          (state.pagination.profiles || 0) + delta,
        );
        return {};
      }
      case "home":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("home");
        return {};
      case "profile":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("profile");
        return {};
      case "profile_edit":
        {
          const profile = await this.requireManageableProfile(
            context,
            state.selectedProfileId,
          );
          state.editor = {
            kind: "profile",
            field: "adminTitle",
            values: {
              adminTitle: profile.adminTitle || "",
              title: this.localizedByLocale(profile.title, "ru"),
              subtitle: this.localizedByLocale(profile.subtitle, "ru"),
              description: this.localizedByLocale(profile.description, "ru"),
            },
          };
        }
        state.page = "profile";
        return {};
      case "skip":
        if (state.editor?.kind !== "profile") {
          throw new Error("Пропуск для этого редактора не поддерживается.");
        }
        this.advanceProfileEditor(state.editor);
        return {
          notice: { kind: "info", text: "Текущее значение сохранено." },
        };
      case "clear":
        if (
          state.editor?.kind !== "profile" ||
          !["subtitle", "description"].includes(state.editor.field)
        ) {
          throw new Error("Это поле нельзя очистить.");
        }
        state.editor.values[state.editor.field] = "";
        this.advanceProfileEditor(state.editor);
        return { notice: { kind: "info", text: "Поле очищено." } };
      case "save":
        if (state.editor?.kind !== "profile" || state.editor.field !== "save") {
          throw new Error("Сохранение больше недоступно.");
        }
        await this.saveProfileEditor(context, state);
        return { notice: { kind: "success", text: "Изменения сохранены." } };
      case "mcp":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("mcp");
        return {};
      case "mcp_toggle":
        await this.toggleMcp(context, state, input.token);
        return {
          notice: { kind: "success", text: "Настройка MCP сохранена." },
        };
      case "avatar":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("avatar");
        return {};
      case "avatar_replace":
        await this.requireManageableProfile(context, state.selectedProfileId);
        state.page = "avatar";
        state.editor = { kind: "avatar", field: "file", values: {} };
        return {};
      case "avatar_reset":
        await this.requireManageableProfile(context, state.selectedProfileId);
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate(
          {
            ...this.requestProps(context, state),
            data: { reset: true },
          },
        );
        state.page = "avatar";
        state.editor = undefined;
        return {
          notice: {
            kind: "success",
            text: "Установлен дефолтный аватар.",
          },
        };
      case "skills":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("skills");
        return {};
      case "skills_available":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("skills-available");
        return {};
      case "skills_prev":
      case "skills_next":
      case "available_prev":
      case "available_next": {
        const available = input.action.startsWith("available");
        const key = available ? "availableSkills" : "skills";
        const delta = input.action.endsWith("next") ? 1 : -1;
        state.pagination[key] = Math.max(
          0,
          (state.pagination[key] || 0) + delta,
        );
        return {};
      }
      case "skill_open": {
        const skill = await this.requireLinkedSkillByToken(
          context,
          state,
          input.token,
        );
        state.selectedEntityId = skill.id;
        state.page = "skill";
        state.confirmation = undefined;
        return {};
      }
      case "skill_new":
        await this.requireManageableProfile(context, state.selectedProfileId);
        state.page = "skill";
        state.editor = {
          kind: "skill-create",
          field: "title",
          values: {},
        };
        return {};
      case "skill_edit": {
        const skill = await this.requireLinkedSkill(
          context,
          state,
          state.selectedEntityId,
        );
        state.editor = {
          kind: "skill-edit",
          field: "title",
          entityId: skill.id,
          values: {
            title: skill.title || "",
            slug: skill.slug || "",
            description: skill.description || "",
          },
        };
        return {};
      }
      case "skill_link":
        await this.linkSkill(context, state, input.token);
        state.page = "skills-available";
        return { notice: { kind: "success", text: "Навык подключён." } };
      case "skill_unlink":
        await this.requireLinkedSkill(context, state, state.selectedEntityId);
        state.confirmation = {
          kind: "skill-unlink",
          entityId: state.selectedEntityId as string,
        };
        return {};
      case "knowledge":
        await this.requireManageableProfile(context, state.selectedProfileId);
        navigate("knowledge");
        return {};
      case "knowledge_prev":
      case "knowledge_next": {
        const delta = input.action.endsWith("next") ? 1 : -1;
        state.pagination.knowledge = Math.max(
          0,
          (state.pagination.knowledge || 0) + delta,
        );
        return {};
      }
      case "doc_open": {
        const document = await this.requireKnowledgeDocumentByToken(
          context,
          state,
          input.token,
        );
        state.selectedEntityId = document.id;
        state.page = "document";
        state.confirmation = undefined;
        return {
          notice: {
            kind: "success",
            text: "Содержимое отправлено отдельным TXT-файлом.",
          },
          textFile: this.knowledgeDocumentTextFile(document),
        };
      }
      case "doc_new":
        await this.requireManageableProfile(context, state.selectedProfileId);
        state.page = "document";
        state.editor = {
          kind: "knowledge-create",
          field: "title",
          values: {},
        };
        return {};
      case "doc_edit": {
        const document = await this.requireKnowledgeDocument(
          context,
          state,
          state.selectedEntityId,
        );
        state.editor = {
          kind: "knowledge-edit",
          field: "title",
          entityId: document.id,
          values: {
            title: document.title || "",
            description: document.description || "",
          },
        };
        return {};
      }
      case "doc_reindex":
        await this.reindexDocument(context, state, state.selectedEntityId);
        return {
          notice: { kind: "success", text: "Переиндексация запущена." },
        };
      case "doc_delete":
        await this.requireKnowledgeDocument(
          context,
          state,
          state.selectedEntityId,
        );
        state.confirmation = {
          kind: "knowledge-delete",
          entityId: state.selectedEntityId as string,
        };
        return {};
      case "confirm":
        return this.confirm(context, state);
      case "cancel":
        if (state.editor?.kind.startsWith("skill")) state.page = "skills";
        if (state.editor?.kind.startsWith("knowledge"))
          state.page = "knowledge";
        if (state.editor?.kind === "avatar") state.page = "avatar";
        state.editor = undefined;
        state.confirmation = undefined;
        return { notice: { kind: "info", text: "Редактирование отменено." } };
      default:
        throw new Error("Эта кнопка больше не поддерживается. Обновите меню.");
    }
  }

  protected async confirm(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
  ) {
    if (!state.confirmation) {
      throw new Error("Подтверждение устарело. Повторите действие.");
    }

    if (state.confirmation.kind === "skill-unlink") {
      const skill = await this.requireLinkedSkill(
        context,
        state,
        state.confirmation.entityId,
      );
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlink(
        {
          ...this.requestProps(context, state),
          socialModuleSkillId: skill.id,
        },
      );
      state.page = "skills";
      state.selectedEntityId = undefined;
      state.confirmation = undefined;
      return {
        notice: {
          kind: "success" as const,
          text: "Связь с навыком удалена; сам навык сохранён.",
        },
      };
    }

    const document = await this.requireKnowledgeDocument(
      context,
      state,
      state.confirmation.entityId,
    );
    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdDelete(
      {
        ...this.requestProps(context, state),
        knowledgeModuleDocumentId: document.id,
      },
    );
    state.page = "knowledge";
    state.selectedEntityId = undefined;
    state.confirmation = undefined;
    return {
      notice: { kind: "success" as const, text: "Документ удалён." },
    };
  }

  protected async consumeEditorInput(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    message: ISocialModuleMessage,
    transport: ITelegramAssistantConversationTransport,
  ) {
    const editor = state.editor;

    if (!editor) return;

    if (editor.kind === "avatar") {
      const file = await transport.resolveEditorFile(message);

      if (!file || !file.type.startsWith("image/")) {
        throw new Error("Пришлите фотографию или изображение как файл.");
      }

      await this.requireManageableProfile(context, state.selectedProfileId);
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdAvatarUpdate(
        {
          ...this.requestProps(context, state),
          data: { file },
        },
      );
      state.editor = undefined;
      state.page = "avatar";
      return;
    }

    const isKnowledgeContent =
      (editor.kind === "knowledge-create" ||
        editor.kind === "knowledge-edit") &&
      editor.field === "description";
    const editorFile = isKnowledgeContent
      ? await transport.resolveEditorFile(message)
      : undefined;
    let value = message.description?.trim();

    if (editorFile) {
      if (!this.isKnowledgeTextFile(editorFile)) {
        throw new Error(
          "Для содержимого знания поддерживаются текстовые файлы: TXT, Markdown, CSV, JSON, XML и YAML.",
        );
      }

      value = (await editorFile.text()).replace(/^\uFEFF/, "").trim();
    }

    if (!value) {
      throw new Error(
        "Значение не может быть пустым. Используйте кнопку «Отмена».",
      );
    }

    const maxLength = isKnowledgeContent
      ? knowledgeContentMaxLength
      : inlineEditorValueMaxLength;

    if (value.length > maxLength) {
      throw new Error(
        `Значение слишком длинное (максимум ${maxLength.toLocaleString("ru-RU")} символов).`,
      );
    }

    if (
      (editor.kind === "skill-create" || editor.kind === "skill-edit") &&
      editor.field === "slug" &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)
    ) {
      throw new Error("Slug должен содержать латинские буквы, цифры и дефисы.");
    }

    editor.values[editor.field] = value;

    if (editor.kind === "profile") {
      this.advanceProfileEditor(editor);
      return;
    }

    if (editor.kind === "skill-create" || editor.kind === "skill-edit") {
      const fields = ["title", "slug", "description"];
      const index = fields.indexOf(editor.field);

      if (index < fields.length - 1) {
        editor.field = fields[index + 1];
        return;
      }

      await this.requireManageableProfile(context, state.selectedProfileId);
      const data = {
        title: String(editor.values.title),
        slug: String(editor.values.slug),
        description: String(editor.values.description),
      };

      if (editor.kind === "skill-create") {
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillCreate(
          { ...this.requestProps(context, state), data },
        );
      } else {
        await this.requireLinkedSkill(context, state, editor.entityId);
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate(
          {
            ...this.requestProps(context, state),
            socialModuleSkillId: editor.entityId as string,
            data,
          },
        );
      }

      state.editor = undefined;
      state.page = "skills";
      state.selectedEntityId = undefined;
      return;
    }

    const fields = ["title", "description"];
    const index = fields.indexOf(editor.field);

    if (index < fields.length - 1) {
      editor.field = fields[index + 1];
      return;
    }

    await this.requireManageableProfile(context, state.selectedProfileId);
    const data = {
      title: String(editor.values.title),
      description: String(editor.values.description),
    };

    if (editor.kind === "knowledge-create") {
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentCreate(
        { ...this.requestProps(context, state), data },
      );
    } else {
      await this.requireKnowledgeDocument(context, state, editor.entityId);
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdUpdate(
        {
          ...this.requestProps(context, state),
          knowledgeModuleDocumentId: editor.entityId as string,
          data,
        },
      );
    }

    state.editor = undefined;
    state.page = "knowledge";
    state.selectedEntityId = undefined;
  }

  protected isKnowledgeTextFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const type = file.type.toLowerCase();

    return (
      type.startsWith("text/") ||
      [
        "application/json",
        "application/ld+json",
        "application/xml",
        "application/x-yaml",
        "application/yaml",
      ].includes(type) ||
      knowledgeTextFileExtensions.has(extension)
    );
  }

  protected async render(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    transport: ITelegramAssistantConversationTransport,
    notice?: TNotice,
  ): Promise<unknown> {
    let data: ITelegramAssistantMessageData;
    const renderState = state.presentationMessageId
      ? state
      : { ...state, revision: state.revision + 1 };

    try {
      data = await this.renderData(context, renderState, transport, notice);
    } catch (error) {
      await this.runtime.terminate(context.key);
      data = {
        description: `${this.errorMessage(error)}\n\nДиалог закрыт. Повторите /assistant после восстановления доступа.`,
        interaction: { inline_keyboard: [] },
      };
    }

    const rememberPresentation = async (
      created: { id?: string; sourceSystemId?: string | null },
      presentationMediaUrl?: string,
    ) => {
      if (!created.id) return;

      await this.runtime.update(context.key, (draft) => {
        draft.presentationMessageId = created.id;
        draft.presentationMessageSourceSystemId =
          created.sourceSystemId || undefined;
        draft.presentationMediaUrl = presentationMediaUrl;
      });
    };

    if (!state.presentationMessageId) {
      const created = await transport.create(data);

      if (!created.id) return created;

      await rememberPresentation(created, data.presentationMediaUrl);

      return created;
    }

    if (state.presentationMediaUrl !== data.presentationMediaUrl) {
      await transport
        .update(state.presentationMessageId, {
          description: "Меню продолжено в новом сообщении.",
          interaction: { inline_keyboard: [] },
        })
        .catch(() => undefined);

      const replacementData = await this.renderData(
        context,
        { ...state, revision: state.revision + 1 },
        transport,
        notice,
      );
      const replacement = await transport.create(replacementData);

      if (!replacement.id) return replacement;

      await rememberPresentation(
        replacement,
        replacementData.presentationMediaUrl,
      );

      return replacement;
    }

    try {
      return await transport.update(state.presentationMessageId, data);
    } catch (error) {
      let replacementData: ITelegramAssistantMessageData;

      try {
        replacementData = await this.renderData(
          context,
          { ...state, revision: state.revision + 1 },
          transport,
          notice,
        );
      } catch (renderError) {
        await this.runtime.terminate(context.key);
        replacementData = {
          description: `${this.errorMessage(renderError)}\n\nДиалог закрыт. Повторите /assistant после восстановления доступа.`,
          interaction: { inline_keyboard: [] },
        };
      }

      const replacement = await transport.create(replacementData);

      if (!replacement.id) throw error;

      await this.runtime.update(context.key, (draft) => {
        draft.presentationMessageId = replacement.id;
        draft.presentationMessageSourceSystemId =
          replacement.sourceSystemId || undefined;
        draft.presentationMediaUrl = replacementData.presentationMediaUrl;
      });

      return replacement;
    }
  }

  protected async renderData(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    transport: ITelegramAssistantConversationTransport,
    notice?: TNotice,
  ): Promise<ITelegramAssistantMessageData> {
    const rows: NonNullable<
      ITelegramAssistantMessageData["interaction"]
    >["inline_keyboard"] = [];
    const button = (text: string, action: string, token?: string) => ({
      text,
      callback_data: this.runtime.encodeCallback(state, action, token),
    });
    const noticeText = notice
      ? `${notice.kind === "error" ? "⚠️" : notice.kind === "success" ? "✅" : "ℹ️"} ${notice.text}\n\n`
      : "";

    if (state.editor) {
      const labels: Record<string, string> = {
        adminTitle: "административное имя",
        title: "название (ru)",
        subtitle: "подзаголовок (ru)",
        description: "описание/содержимое",
        slug: "slug",
        file: "изображение",
      };
      if (state.editor.kind === "profile" && state.editor.field === "save") {
        rows.push([button("Сохранить", "save"), button("Отмена", "cancel")]);

        return {
          description: `${noticeText}Проверьте изменения профиля:\nAdmin title: ${this.editorValue(state.editor.values.adminTitle)}\nНазвание: ${this.editorValue(state.editor.values.title)}\nПодзаголовок: ${this.editorValue(state.editor.values.subtitle)}\nОписание: ${this.editorValue(state.editor.values.description)}`,
          interaction: { inline_keyboard: rows },
        };
      }

      if (state.editor.kind === "profile") {
        const actions = [button("Пропустить", "skip")];

        if (["subtitle", "description"].includes(state.editor.field)) {
          actions.push(button("Очистить", "clear"));
        }

        rows.push(actions);
      }
      rows.push([button("Отмена", "cancel")]);

      if (state.editor.kind === "avatar") {
        const profile = await this.requireManageableProfile(
          context,
          state.selectedProfileId,
        );
        const avatar = await transport.resolveProfileAvatar(profile.id);

        return {
          description: `${noticeText}Редактор: пришлите изображение.\nПоддерживается Telegram photo или image-документ.`,
          files: avatar?.file ? [avatar.file] : undefined,
          presentationMediaUrl: avatar?.file ? avatar.url : undefined,
          interaction: { inline_keyboard: rows },
        };
      }

      return {
        description: `${noticeText}Редактор: пришлите ${labels[state.editor.field] || state.editor.field}.${state.editor.kind === "profile" ? `\nТекущее значение: ${this.editorValue(state.editor.values[state.editor.field])}` : ""}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "selector") {
      const profiles = await this.manageableProfiles(context);
      const page = state.pagination.profiles || 0;
      const offset = page * pageSize;
      profiles.slice(offset, offset + pageSize).forEach((profile) => {
        rows.push([
          button(
            this.profileTitle(profile),
            "select",
            this.entityToken(String(profile.id)),
          ),
        ]);
      });
      const pagination: ReturnType<typeof button>[] = [];
      if (page > 0) pagination.push(button("←", "profiles_prev"));
      if (profiles.length > offset + pageSize)
        pagination.push(button("→", "profiles_next"));
      if (pagination.length) rows.push(pagination);
      rows.push([button("Обновить", "refresh"), button("Закрыть", "close")]);
      return {
        description: `${noticeText}Выберите AI-ассистента для управления · страница ${page + 1}:`,
        interaction: { inline_keyboard: rows },
      };
    }

    const profile = await this.requireManageableProfile(
      context,
      state.selectedProfileId,
    );
    const backToHome = [button("Назад", "home")];

    if (state.page === "home") {
      const avatar = await transport.resolveProfileAvatar(profile.id);
      rows.push(
        [button("Профиль", "profile"), button("MCP", "mcp")],
        [button("Навыки", "skills"), button("Знания", "knowledge")],
        [button("Аватар", "avatar"), button("Обновить", "refresh")],
      );
      rows.push([button("Сменить", "selector"), button("Закрыть", "close")]);
      return {
        description: `${noticeText}AI-ассистент: ${this.profileDisplayName(profile)}\n${this.localized(profile.subtitle) || "Без подзаголовка"}\nАватар: ${avatar ? (avatar.isDefault ? "дефолтный" : "собственный") : "не настроен"}\n\n${this.localized(profile.description) || "Описание не задано"}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "profile") {
      rows.push([button("Редактировать", "profile_edit")], backToHome);
      return {
        description: `${noticeText}Профиль\nAdmin title: ${profile.adminTitle || "—"}\nНазвание: ${this.localized(profile.title) || "—"}\nПодзаголовок: ${this.localized(profile.subtitle) || "—"}\nОписание: ${this.localized(profile.description) || "—"}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "mcp") {
      const enabled = new Set(profile.allowedMcpServerIds || []);
      supportedMcpServerDescriptors.forEach((descriptor) => {
        rows.push([
          button(
            `${enabled.has(descriptor.id) ? "✅" : "⬜️"} ${descriptor.title}`,
            "mcp_toggle",
            descriptor.id,
          ),
        ]);
      });
      const stale = (profile.allowedMcpServerIds || []).filter(
        (id: string) =>
          !supportedMcpServerDescriptors.some((item) => item.id === id),
      );
      rows.push(backToHome);
      return {
        description: `${noticeText}MCP-серверы\nВключайте только поддерживаемые подключения.${stale.length ? `\nНеизвестные сохранённые ID не изменяются: ${stale.join(", ")}` : ""}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "avatar") {
      const avatar = await transport.resolveProfileAvatar(profile.id);
      rows.push([button("Заменить", "avatar_replace")]);
      if (avatar && !avatar.isDefault) {
        rows.push([button("Удалить", "avatar_reset")]);
      }
      if (avatar) {
        rows.push([{ text: "Открыть текущий аватар", url: avatar.url }]);
      }
      rows.push(backToHome);
      return {
        description: `${noticeText}Аватар ассистента\nТекущий: ${avatar ? (avatar.isDefault ? "дефолтный" : "собственный") : "не настроен"}${avatar ? `\n\n[Показать текущий аватар](${avatar.url})` : "\n\nДефолтный аватар не настроен в File Storage."}`,
        files: avatar?.file ? [avatar.file] : undefined,
        presentationMediaUrl: avatar?.file ? avatar.url : undefined,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "skills" || state.page === "skills-available") {
      const available = state.page === "skills-available";
      const page =
        state.pagination[available ? "availableSkills" : "skills"] || 0;
      const skills = available
        ? await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable(
            {
              ...this.requestProps(context, state),
              limit: pageSize + 1,
              offset: page * pageSize,
            },
          )
        : await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
            {
              ...this.requestProps(context, state),
              limit: pageSize + 1,
              offset: page * pageSize,
            },
          );
      skills.slice(0, pageSize).forEach((skill) => {
        rows.push([
          button(
            `${available ? "Подключить: " : ""}${skill.title || skill.slug || skill.id}`,
            available ? "skill_link" : "skill_open",
            this.entityToken(String(skill.id)),
          ),
        ]);
      });
      const pagination: ReturnType<typeof button>[] = [];
      if (page > 0)
        pagination.push(
          button("←", available ? "available_prev" : "skills_prev"),
        );
      if (skills.length > pageSize)
        pagination.push(
          button("→", available ? "available_next" : "skills_next"),
        );
      if (pagination.length) rows.push(pagination);
      rows.push(
        available
          ? [button("Подключённые", "skills")]
          : [
              button("Создать", "skill_new"),
              button("Доступные", "skills_available"),
            ],
        backToHome,
      );
      return {
        description: `${noticeText}${available ? "Доступные навыки" : "Подключённые навыки"} · страница ${page + 1}${skills.length ? "" : "\nСписок пуст."}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "skill") {
      const skill = state.selectedEntityId
        ? await this.requireLinkedSkill(context, state, state.selectedEntityId)
        : undefined;
      if (state.confirmation?.kind === "skill-unlink") {
        rows.push([
          button("Да, отвязать", "confirm"),
          button("Отмена", "cancel"),
        ]);
      } else if (skill) {
        rows.push(
          [button("Редактировать", "skill_edit")],
          [button("Отвязать", "skill_unlink")],
          [button("Назад", "skills")],
        );
      }
      return {
        description: `${noticeText}${state.confirmation ? "Подтвердите отвязку навыка. Сам глобальный навык удалён не будет." : `Навык: ${skill?.title || "Новый"}\nSlug: ${skill?.slug || "—"}\n${skill?.description || ""}`}`,
        interaction: { inline_keyboard: rows },
      };
    }

    if (state.page === "knowledge") {
      const page = state.pagination.knowledge || 0;
      const documents =
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
          {
            ...this.requestProps(context, state),
            limit: pageSize + 1,
            offset: page * pageSize,
          },
        );
      documents.slice(0, pageSize).forEach((document) => {
        rows.push([
          button(
            this.truncateText(document.title || document.id, 60),
            "doc_open",
            this.entityToken(String(document.id)),
          ),
        ]);
      });
      const pagination: ReturnType<typeof button>[] = [];
      if (page > 0) pagination.push(button("←", "knowledge_prev"));
      if (documents.length > pageSize)
        pagination.push(button("→", "knowledge_next"));
      if (pagination.length) rows.push(pagination);
      rows.push([button("Создать документ", "doc_new")], backToHome);
      return {
        description: `${noticeText}Knowledge-документы · страница ${page + 1}${documents.length ? "" : "\nСписок пуст."}`,
        interaction: { inline_keyboard: rows },
      };
    }

    const document = state.selectedEntityId
      ? await this.requireKnowledgeDocument(
          context,
          state,
          state.selectedEntityId,
        )
      : undefined;
    if (state.confirmation?.kind === "knowledge-delete") {
      rows.push([button("Да, удалить", "confirm"), button("Отмена", "cancel")]);
    } else if (document) {
      rows.push(
        [
          button("Редактировать", "doc_edit"),
          button("Переиндексировать", "doc_reindex"),
        ],
        [button("Удалить", "doc_delete")],
        [button("Назад", "knowledge")],
      );
    }
    return {
      description: `${noticeText}${state.confirmation ? "Подтвердите окончательное удаление Knowledge-документа." : `Документ: ${this.truncateText(document?.title || "Новый", 300)}\n\nСодержимое документа передаётся отдельным TXT-файлом.`}`,
      interaction: { inline_keyboard: rows },
    };
  }

  protected knowledgeDocumentTextFile(document: {
    id: string;
    title?: string | null;
    description?: string | null;
  }) {
    const title = document.title?.trim() || `knowledge-${document.id}`;
    const safeFileName =
      title
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
        .replace(/[. ]+$/g, "")
        .slice(0, 120) || `knowledge-${document.id}`;
    const content = [title, document.description || ""].join("\n\n");

    return {
      caption: `Knowledge-документ «${this.truncateText(title, 180)}»`,
      file: new File([content], `${safeFileName}.txt`, {
        type: "text/plain",
      }),
    };
  }

  protected truncateText(value: string, limit: number) {
    return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
  }

  protected async manageableProfiles(
    context: ITelegramAssistantConversationContext,
  ): Promise<ISocialModuleProfile[]> {
    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFind(
      {
        id: context.requesterSubject.id,
        socialModuleProfileId: context.requesterProfileId,
        socialModuleChatId: context.socialModuleChatId,
        options: this.authorization(context),
      },
    );
  }

  protected async requireManageableProfile(
    context: ITelegramAssistantConversationContext,
    profileId?: string,
  ) {
    if (!profileId) {
      throw new Error("Профиль ассистента не выбран.");
    }

    const profile = (await this.manageableProfiles(context)).find(
      (item) => item.id === profileId,
    );

    if (!profile) {
      throw new Error("Профиль больше недоступен для управления в этом чате.");
    }

    return profile;
  }

  protected async requireManageableProfileByToken(
    context: ITelegramAssistantConversationContext,
    token?: string,
  ) {
    return this.resolveEntityToken(
      await this.manageableProfiles(context),
      token,
      "Профиль больше недоступен для управления в этом чате.",
    );
  }

  protected async requireLinkedSkill(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    skillId?: string,
  ) {
    await this.requireManageableProfile(context, state.selectedProfileId);
    const skills =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
        this.requestProps(context, state),
      );
    const skill = skills.find((item) => item.id === skillId);

    if (!skill) throw new Error("Навык больше не подключён к профилю.");
    return skill;
  }

  protected async requireLinkedSkillByToken(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    token?: string,
  ) {
    await this.requireManageableProfile(context, state.selectedProfileId);
    const skills =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
        this.requestProps(context, state),
      );

    return this.resolveEntityToken(
      skills,
      token,
      "Навык больше не подключён к профилю.",
    );
  }

  protected async requireKnowledgeDocument(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    documentId?: string,
  ) {
    await this.requireManageableProfile(context, state.selectedProfileId);
    const documents =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
        this.requestProps(context, state),
      );
    const document = documents.find((item) => item.id === documentId);

    if (!document) throw new Error("Документ больше не связан с профилем.");
    return document;
  }

  protected async requireKnowledgeDocumentByToken(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    token?: string,
  ) {
    await this.requireManageableProfile(context, state.selectedProfileId);
    const documents =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFind(
        this.requestProps(context, state),
      );

    return this.resolveEntityToken(
      documents,
      token,
      "Документ больше не связан с профилем.",
    );
  }

  protected async toggleMcp(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    identifier?: string,
  ) {
    const descriptor = supportedMcpServerDescriptors.find(
      (item) => item.id === identifier,
    );
    if (!descriptor) throw new Error("Этот MCP-сервер не поддерживается.");
    const profile = await this.requireManageableProfile(
      context,
      state.selectedProfileId,
    );
    const configuredIdentifiers = profile.allowedMcpServerIds || [];
    const enabled = configuredIdentifiers.includes(descriptor.id);
    const allowedMcpServerIds = enabled
      ? configuredIdentifiers.filter((id: string) => id !== descriptor.id)
      : [...new Set([...configuredIdentifiers, descriptor.id])];
    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
      {
        ...this.requestProps(context, state),
        data: {
          allowedMcpServerIds,
        },
      },
    );
  }

  protected async linkSkill(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    skillId?: string,
  ) {
    await this.requireManageableProfile(context, state.selectedProfileId);
    const available =
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable(
        this.requestProps(context, state),
      );
    const skill = this.resolveEntityToken(
      available,
      skillId,
      "Навык уже подключён или больше недоступен.",
    );
    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillLink(
      {
        ...this.requestProps(context, state),
        socialModuleSkillId: skill.id,
      },
    );
  }

  protected resolveEntityToken<T extends { id: string }>(
    entities: T[],
    token: string | undefined,
    missingMessage: string,
  ) {
    if (!token) throw new Error(missingMessage);
    const matches = entities.filter(
      (entity) => this.entityToken(String(entity.id)) === token,
    );

    if (matches.length !== 1) {
      throw new Error(missingMessage);
    }

    return matches[0];
  }

  protected entityToken(id: string) {
    let high = 0xdeadbeef;
    let low = 0x41c6ce57;

    for (let index = 0; index < id.length; index += 1) {
      const code = id.charCodeAt(index);
      high = Math.imul(high ^ code, 2654435761);
      low = Math.imul(low ^ code, 1597334677);
    }

    high =
      Math.imul(high ^ (high >>> 16), 2246822507) ^
      Math.imul(low ^ (low >>> 13), 3266489909);
    low =
      Math.imul(low ^ (low >>> 16), 2246822507) ^
      Math.imul(high ^ (high >>> 13), 3266489909);

    return `e${(4_294_967_296 * (2_097_151 & low) + (high >>> 0)).toString(
      36,
    )}`;
  }

  protected async reindexDocument(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
    documentId?: string,
  ) {
    const document = await this.requireKnowledgeDocument(
      context,
      state,
      documentId,
    );
    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeDocumentFindByIdReindex(
      {
        ...this.requestProps(context, state),
        knowledgeModuleDocumentId: document.id,
      },
    );
  }

  protected requestProps(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
  ) {
    if (!state.selectedProfileId) {
      throw new Error("Профиль ассистента не выбран.");
    }

    return {
      id: context.requesterSubject.id,
      socialModuleProfileId: context.requesterProfileId,
      socialModuleChatId: context.socialModuleChatId,
      targetSocialModuleProfileId: state.selectedProfileId,
      options: this.authorization(context),
    };
  }

  protected authorization(context: ITelegramAssistantConversationContext) {
    return {
      headers: {
        Authorization: `Bearer ${context.requesterJwtToken}`,
        "Cache-Control": "no-store",
      },
    };
  }

  protected profileTitle(profile: ISocialModuleProfile) {
    return (
      profile.adminTitle ||
      this.localized(profile.title) ||
      profile.slug ||
      profile.id
    );
  }

  protected profileDisplayName(profile: ISocialModuleProfile) {
    return (
      this.localized(profile.title) ||
      profile.adminTitle ||
      profile.slug ||
      profile.id
    );
  }

  protected localized(value: unknown) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    const record = value as Record<string, unknown>;

    return String(record.ru || record.en || Object.values(record)[0] || "");
  }

  protected localizedByLocale(value: unknown, locale: string) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";

    return String((value as Record<string, unknown>)[locale] || "");
  }

  protected localizedRecord(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return { ...(value as Record<string, unknown>) };
  }

  protected editorValue(value: unknown) {
    const text = String(value || "");

    if (!text) return "—";
    return text.length > 240 ? `${text.slice(0, 237)}…` : text;
  }

  protected advanceProfileEditor(editor: ITelegramConversationState["editor"]) {
    if (!editor || editor.kind !== "profile") return;
    const fields = ["adminTitle", "title", "subtitle", "description"];
    const index = fields.indexOf(editor.field);

    editor.field = index >= fields.length - 1 ? "save" : fields[index + 1];
  }

  protected async saveProfileEditor(
    context: ITelegramAssistantConversationContext,
    state: ITelegramConversationState,
  ) {
    const editor = state.editor;

    if (!editor || editor.kind !== "profile" || editor.field !== "save") {
      throw new Error("Редактор профиля не готов к сохранению.");
    }

    const profile = await this.requireManageableProfile(
      context,
      state.selectedProfileId,
    );
    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
      {
        ...this.requestProps(context, state),
        data: {
          adminTitle: String(editor.values.adminTitle),
          title: {
            ...this.localizedRecord(profile.title),
            ru: String(editor.values.title),
          },
          subtitle: {
            ...this.localizedRecord(profile.subtitle),
            ru: String(editor.values.subtitle),
          },
          description: {
            ...this.localizedRecord(profile.description),
            ru: String(editor.values.description),
          },
        },
      },
    );
    state.editor = undefined;
    state.page = "profile";
  }

  protected errorMessage(error: unknown) {
    const raw = error instanceof Error ? error.message : String(error);

    return `Не удалось выполнить действие: ${raw}`;
  }
}
