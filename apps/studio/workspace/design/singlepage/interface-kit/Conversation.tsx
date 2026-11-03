import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, Checkbox, Icon, kit, Specimen } from "./primitives";
import { FileRow, type ILocalFile } from "./Files";

type ReplyState = "idle" | "streaming" | "stopped" | "error" | "complete";

export default function Conversation() {
  const [helpful, setHelpful] = useState(false);
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<ILocalFile[]>([]);
  const [sentAttachments, setSentAttachments] = useState<ILocalFile[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [replyState, setReplyState] = useState<ReplyState>("idle");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const fieldId = useId();
  const helpId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const attachmentsHelpId = useId();
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }, []);

  useEffect(() => {
    if (replyState !== "streaming") return;
    const timer = window.setTimeout(() => {
      if (visibleCharacters >= reply.length) setReplyState("complete");
      else setVisibleCharacters((value) => Math.min(reply.length, value + 8));
    }, 70);
    return () => window.clearTimeout(timer);
  }, [replyState, visibleCharacters, reply]);

  const send = () => {
    if ((!draft.trim() && !attachments.length) || replyState === "streaming")
      return;
    setQuestion(draft.trim());
    setSentAttachments(attachments);
    setAttachments([]);
    setAttachmentErrors([]);
    setDraft("");
    setReply(
      "Это пример ответа. Сгруппируйте имеющиеся материалы: заметки проекта, вопросы клиентов и предложения. Затем выберите один открытый вопрос для совместной проверки.",
    );
    setVisibleCharacters(0);
    setReplyState(simulateFailure ? "error" : "streaming");
    input.current?.focus();
  };

  const retry = () => {
    setSimulateFailure(false);
    setVisibleCharacters(0);
    setReplyState("streaming");
  };

  return (
    <div className="grid gap-6">
      <Specimen
        id="message"
        title="Сообщения"
        description="В переписке различимы роль, содержание и вспомогательные материалы."
        states={["User", "Assistant", "Источник прикреплён", "Оценка выбрана"]}
        usage="Ограничивайте ширину текста, показывайте роли и названия источников. Это примеры сообщений, не настоящий ответ модели."
        recipe="max-w-2xl rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 text-base leading-relaxed"
      >
        <div className="grid gap-5">
          <div className="ml-auto max-w-2xl rounded-2xl bg-[var(--workspace-brand-background)] p-5">
            <p className={`mb-2 text-xs font-semibold ${kit.muted}`}>
              Вы · пример
            </p>
            <p className="text-base leading-relaxed">
              У меня есть заметки проекта и вопросы клиентов. С чего начать?
            </p>
            <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-xs">
              <Icon name="file-text" />
              <span className="break-all">project-notes.md · пример</span>
            </span>
          </div>
          <div className="max-w-2xl rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
                <Icon name="chat-circle" />
              </span>
              <p className="text-xs font-semibold">Ассистент · пример</p>
            </div>
            <p className="text-base leading-relaxed">
              Сгруппируйте материалы по тому, что они объясняют: предложение,
              аудиторию и вопросы без ответа.
            </p>
            <p className={`mt-3 text-sm ${kit.muted}`}>
              Источник: project-notes.md. Это пример ссылки.
            </p>
            <Button
              variant="plain"
              className="mt-3"
              aria-pressed={helpful}
              onClick={() => setHelpful((value) => !value)}
            >
              <Icon name="check" />
              {helpful ? "Отмечено полезным" : "Отметить полезным"}
            </Button>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="composer"
        title="Поле сообщения"
        description="Напишите сообщение, прикрепите локальные файлы, затем посмотрите, остановите или повторите пример ответа."
        states={[
          "Пусто",
          "Готово",
          "Файлы прикреплены",
          "Вложение удалено",
          "Файл слишком большой",
          "Сообщение только с файлами",
          "Streaming",
          "Остановлено",
          "Ошибка",
          "Retrying",
          "Complete",
        ]}
        usage="Прикрепляйте несколько файлов, убирайте выбранное, отправляйте с текстом или без. До 10 МБ на файл. Пример показывает только имя, тип и размер; содержимое остаётся на устройстве. Черновик доступен при ответе. Во время ответа есть остановка, после прерывания или сбоя — повтор. Модель и сервер не подключены."
        recipe={`${kit.field} min-h-28 resize-y / ${kit.card} / ${kit.button}; вложения: общий FileRow, выбор до отправки и сохранение в отправленном сообщении`}
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm">
          <Icon name="question" />
          <p>
            Локальный пример. Сообщения и ответы остаются здесь и исчезают при
            перезагрузке.
          </p>
        </div>
        {question || sentAttachments.length ? (
          <div className="mb-5 grid gap-4">
            <div className="ml-auto w-fit max-w-2xl rounded-2xl bg-[var(--workspace-brand-background)] p-4">
              <p className={`mb-2 text-xs font-semibold ${kit.muted}`}>
                Ваше сообщение в примере
              </p>
              {question ? (
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                  {question}
                </p>
              ) : null}
              {sentAttachments.length ? (
                <ul
                  aria-label="Вложения отправленного сообщения"
                  className="mt-3 grid gap-2"
                >
                  {sentAttachments.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </ul>
              ) : null}
            </div>
            <div
              className={`${kit.card} max-w-2xl`}
              aria-busy={replyState === "streaming"}
            >
              <p className="mb-3 text-xs font-semibold">Пример ассистента</p>
              {replyState === "error" ? (
                <div className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-4 text-sm text-[var(--workspace-brand-danger)]">
                  <p className="font-semibold">Пример ответа прерван</p>
                  <p className="mt-2">
                    Включён режим ошибки. Повтор запускает ответ локально.
                  </p>
                </div>
              ) : (
                <p className="min-h-6 whitespace-pre-wrap break-words text-base leading-relaxed">
                  {reply.slice(0, visibleCharacters) ||
                    (replyState === "stopped"
                      ? "Ответ остановлен до появления текста."
                      : "Подготовка примера ответа…")}
                  {replyState === "streaming" ? (
                    <span
                      className="ml-1 inline-block h-4 w-1 bg-[var(--workspace-brand-primary)] motion-safe:animate-pulse"
                      aria-hidden="true"
                    />
                  ) : null}
                </p>
              )}
              {replyState === "stopped" || replyState === "error" ? (
                <Button variant="secondary" className="mt-4" onClick={retry}>
                  Повторить пример ответа
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        <p
          role="status"
          aria-live="polite"
          className={`mb-3 min-h-5 text-sm ${kit.muted}`}
        >
          {replyState === "streaming"
            ? "Показывается пример потокового ответа…"
            : replyState === "stopped"
              ? "Ответ остановлен. Можно повторить или отправить другое сообщение."
              : replyState === "error"
                ? "Пример ошибки. Доступен повтор."
                : replyState === "complete"
                  ? "Пример ответа завершён."
                  : "Можно отправить сообщение в примере."}
        </p>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor={fieldId} className={kit.label}>
            Ваше сообщение
          </label>
          <textarea
            ref={input}
            id={fieldId}
            className={`${kit.field} min-h-28 resize-y`}
            maxLength={2000}
            value={draft}
            aria-describedby={helpId}
            placeholder="Спросите о своём проекте…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                aria-label="Прикрепить файлы к сообщению примера"
                onChange={(event) => {
                  const accepted: ILocalFile[] = [];
                  const rejected: string[] = [];
                  for (const file of Array.from(event.target.files ?? [])) {
                    if (file.size > 10 * 1024 * 1024) {
                      rejected.push(
                        `${file.name}: в примере допустимы файлы до 10 МБ.`,
                      );
                    } else {
                      accepted.push({
                        id: `${file.name}:${file.size}:${file.lastModified}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      });
                    }
                  }
                  setAttachmentErrors(rejected);
                  setAttachments((current) => {
                    const known = new Set(current.map((file) => file.id));
                    return [
                      ...current,
                      ...accepted.filter((file) => {
                        if (known.has(file.id)) return false;
                        known.add(file.id);
                        return true;
                      }),
                    ];
                  });
                  event.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInput.current?.click()}
                aria-describedby={attachmentsHelpId}
              >
                <Icon name="plus" />
                Прикрепить файлы
              </Button>
              <p id={attachmentsHelpId} className={`text-xs ${kit.muted}`}>
                До 10 МБ на файл · только локальный просмотр
              </p>
            </div>
            {attachmentErrors.length ? (
              <div
                role="alert"
                className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-3 text-sm text-[var(--workspace-brand-danger)]"
              >
                {attachmentErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            ) : null}
            {attachments.length ? (
              <ul aria-label="Файлы черновика" className="grid gap-2">
                {attachments.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onRemove={removeAttachment}
                  />
                ))}
              </ul>
            ) : null}
            <p role="status" className={`text-xs ${kit.muted}`}>
              {attachments.length
                ? `${attachments.length} — файлов в черновике.`
                : "Файлы не прикреплены."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id={helpId} className={`text-xs ${kit.muted}`}>
              Enter — отправить · Shift+Enter — новая строка · {draft.length}
              /2000
            </p>
            {replyState === "streaming" ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setReplyState("stopped");
                  input.current?.focus();
                }}
              >
                Остановить ответ
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!draft.trim() && !attachments.length}
              >
                <Icon name="arrow-right" />
                Отправить сообщение примера
              </Button>
            )}
          </div>
          <label
            className={`mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm ${kit.muted}`}
          >
            <Checkbox
              checked={simulateFailure}
              disabled={replyState === "streaming"}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />
            Сымитировать ошибку следующего ответа
          </label>
        </form>
      </Specimen>
    </div>
  );
}
