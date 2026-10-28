"use client";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import {
  Component as SourceCard,
  type ISourceCardProps,
} from "../../ai-chat/index";
import { Component as SourceDownload } from "../../../download/ai-chat/index";
import { useSource } from "./Source";
import { sourceMaterials, sourceUserContext } from "../../ai-chat/utils";

interface IDevelopmentHandoffProps {
  title: string;
  content: string;
}

interface ICopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  text: string;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";

function DevelopmentHandoff({ title, content }: IDevelopmentHandoffProps) {
  const headingId = useId();
  const descriptionId = useId();
  const feedbackId = useId();
  const revision = useRef(0);
  const [feedback, setFeedback] = useState<ICopyFeedback>({
    state: "idle",
    text: "",
  });
  const empty =
    !sourceUserContext(content).trim() && !sourceMaterials(content).trim();

  useEffect(() => {
    revision.current += 1;
    setFeedback({ state: "idle", text: "" });
    return () => {
      revision.current += 1;
    };
  }, [title, content]);

  async function copyRequest() {
    if (empty || feedback.state === "pending") return;
    const currentRevision = revision.current;
    setFeedback({ state: "pending", text: "Копируем запрос для разработки…" });
    const request = [
      "Помоги спланировать первую версию сайта или веб-сервиса на SinglePageStartup Code Framework.",
      `Прочитай приложенный документ ${title}.md. Перед этим я проверю его и скачаю из AI Chat.`,
      "Уточняй недостающие сведения и предположения у меня, прежде чем заполнять их.",
      "Первое действие клиента: [опишите одно действие, которое должен выполнить посетитель].",
      "Изучи существующие модули, предложи первое изменение для моей задачи и покажи план до работы с кодом.",
      "Используй существующие возможности фреймворка для аккаунтов, контента, заказов и оплаты, если они нужны для задачи. Сохрани их текущее поведение.",
      "Покажи результат и объясни, что проверить перед следующим изменением.",
    ].join("\n\n");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Не удалось скопировать");
      await navigator.clipboard.writeText(request);
      if (revision.current !== currentRevision) return;
      setFeedback({
        state: "success",
        text: `Запрос для разработки скопирован. Проверьте и скачайте ${title}.md, затем приложите файл в чате с ИИ-помощником по разработке.`,
      });
    } catch {
      if (revision.current !== currentRevision) return;
      setFeedback({
        state: "error",
        text: "Не удалось скопировать запрос. Разрешите доступ к буферу обмена и попробуйте ещё раз. Документ можно скачать выше.",
      });
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className="mt-5 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-4 @xl:p-5"
    >
      <p className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--workspace-brand-muted)]">
        <Icon name="code" />
        От документов к разработке
      </p>
      <h4 id={headingId} className="mt-3 text-xl font-semibold leading-7">
        Используйте этот документ для создания продукта
      </h4>
      <p
        id={descriptionId}
        className="mt-3 text-sm leading-6 text-[color:var(--workspace-brand-muted)]"
      >
        Проверьте сведения и открытые вопросы, затем скачайте текущий текст
        кнопкой выше. Передайте файл ИИ-помощнику по разработке. Используйте
        модули Code Framework для нужных вашему продукту аккаунтов, контента,
        заказов и оплаты.
      </p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
        Проверьте текст перед использованием. Кнопка копирует инструкции;
        скачанный документ нужно приложить отдельно.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={copyRequest}
          disabled={empty || feedback.state === "pending"}
          aria-busy={feedback.state === "pending"}
          aria-describedby={`${descriptionId} ${feedbackId}`}
          className="whitespace-normal text-center"
        >
          <Icon name={feedback.state === "success" ? "check" : "file-text"} />
          {feedback.state === "pending"
            ? "Копируем запрос…"
            : "Скопировать запрос для разработки"}
        </Button>
        <a
          href="/framework"
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold text-[color:var(--workspace-brand-foreground)] hover:underline ${focus}`}
        >
          Посмотреть Code Framework
          <Icon name="arrow-up-right" />
        </a>
      </div>
      <p
        id={feedbackId}
        role={feedback.state === "error" ? "alert" : "status"}
        aria-live={feedback.state === "error" ? "assertive" : "polite"}
        className={`mt-3 min-h-6 text-sm leading-6 ${feedback.state === "error" ? "text-[color:var(--workspace-brand-danger)]" : "text-[color:var(--workspace-brand-muted)]"}`}
      >
        {empty
          ? "Добавьте текст документа, чтобы скопировать запрос для разработки."
          : feedback.text}
      </p>
    </section>
  );
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
export interface ISourceDocumentProps extends ISourceCardProps {}
export function Component(props: ISourceDocumentProps) {
  const { source } = useSource();
  const documentName = `${source.title}.md`;
  return (
    <section
      aria-label={`${documentName} — редактор`}
      className="min-w-0 bg-[color:var(--workspace-brand-background)] p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon name="file-text" />
          {documentName}
        </h3>
        <SourceDownload />
      </div>
      <SourceCard {...props} />
      <DevelopmentHandoff title={source.title} content={source.content} />
    </section>
  );
}
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
