"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Component as SharedIcon } from "../../../../../../../../../../../../../../../../shared/icon";
import type { IDevelopmentHandoffProps } from "./interface";

interface ICopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  text: string;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function DevelopmentHandoff({
  fileName,
  revision,
  hasContent,
  hasPendingProposal,
}: IDevelopmentHandoffProps) {
  const id = useId();
  const generation = useRef(0);
  const [feedback, setFeedback] = useState<ICopyFeedback>({
    state: "idle",
    text: "",
  });
  useEffect(() => {
    generation.current += 1;
    setFeedback((current) =>
      current.state === "idle" && !current.text
        ? current
        : { state: "idle", text: "" },
    );
    return () => {
      generation.current += 1;
    };
  }, [fileName, revision, hasContent, hasPendingProposal]);

  async function copyRequest() {
    if (!hasContent || feedback.state === "pending") return;
    const currentGeneration = generation.current;
    setFeedback({ state: "pending", text: "Копируем запрос для разработки…" });
    const request = [
      "Помоги спланировать первую версию сайта или веб-сервиса на SinglePageStartup Code Framework.",
      `Прочитай приложенный документ ${fileName}. Перед этим я проверю сохранённый текст, добавлю нужные заметки, затем скачаю и приложу файл отдельно. Несохранённые правки и неподтверждённые предложения не входят в скачанный файл.`,
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
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "success",
        text: `Запрос скопирован. Проверьте и сохраните нужный текст, скачайте ${fileName}, затем приложите файл в чате с ИИ-помощником по разработке.`,
      });
    } catch {
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "error",
        text: "Не удалось скопировать запрос. Разрешите доступ к буферу обмена и попробуйте ещё раз. Документ по-прежнему можно скачать.",
      });
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-ds-block="rbac.subject.document-development-handoff"
      className="mt-5 rounded-2xl border border-border bg-card p-4 @xl:p-5"
    >
      <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <SharedIcon variant="phosphor" name="code" />
        От документов к разработке
      </p>
      <h4 id={`${id}-title`} className="mt-3 text-xl font-semibold leading-7">
        Используйте этот документ для создания продукта
      </h4>
      <p
        id={`${id}-description`}
        className="mt-3 text-sm leading-6 text-muted-foreground"
      >
        Проверьте сведения и открытые вопросы, сохраните нужные заметки, затем
        скачайте {fileName} кнопкой скачивания документа. Передайте файл
        ИИ-помощнику по разработке и используйте нужные модули Code Framework:
        аккаунты, контент, заказы и оплату.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Проверьте текст перед использованием. Скачивается сохранённый документ
        без несохранённых заметок и неподтверждённых предложений. Кнопка
        копирует инструкции; файл нужно приложить отдельно.
      </p>
      {hasPendingProposal ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          В чате есть неподтверждённое предложение. Проверьте его перед
          скачиванием сохранённого текста.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyRequest}
          disabled={!hasContent || feedback.state === "pending"}
          aria-busy={feedback.state === "pending"}
          aria-describedby={`${id}-description ${id}-feedback`}
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-normal rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground transition motion-reduce:transition-none enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
        >
          <SharedIcon
            variant="phosphor"
            name={feedback.state === "success" ? "check" : "file-text"}
          />
          {feedback.state === "pending"
            ? "Копируем запрос…"
            : "Скопировать запрос для разработки"}
        </button>
        <a
          href="/?path=/story/modules-host-models-page-singlepage-framework--default"
          target="_top"
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold text-foreground hover:underline ${focus}`}
        >
          Посмотреть Code Framework
          <SharedIcon variant="phosphor" name="arrow-up-right" />
        </a>
      </div>
      <p
        id={`${id}-feedback`}
        role={feedback.state === "error" ? "alert" : "status"}
        aria-live={feedback.state === "error" ? "assertive" : "polite"}
        className={`mt-3 min-h-6 text-sm leading-6 ${feedback.state === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {hasContent
          ? feedback.text
          : "Сохраните текст документа перед копированием запроса для разработки."}
      </p>
    </section>
  );
}
