import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button, Icon, kit, Specimen } from "./primitives";

export default function Feedback() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [toast, setToast] = useState<"saved" | "undone" | null>(null);
  const [toastHovered, setToastHovered] = useState(false);
  const [toastFocused, setToastFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emptyState, setEmptyState] = useState<"empty" | "error" | "retrying">(
    "empty",
  );

  useEffect(() => {
    if (!toast || toastHovered || toastFocused) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast, toastHovered, toastFocused]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      if (progress >= 100) setLoading(false);
      else setProgress((value) => Math.min(100, value + 20));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [loading, progress]);

  useEffect(() => {
    if (emptyState !== "retrying") return;
    const timer = window.setTimeout(() => setEmptyState("empty"), 800);
    return () => window.clearTimeout(timer);
  }, [emptyState]);

  return (
    <div className="grid gap-6">
      <Specimen
        id="alerts"
        title="Сообщения"
        description="Пояснение находится рядом с решением, к которому относится."
        states={["Informational", "Готово", "Dismissed"]}
        usage="Если контекст нужен до действия, оставьте постоянное сообщение в странице. Не полагайтесь только на цвет."
        recipe={`rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4 text-sm ${kit.focus}`}
      >
        <div className="grid gap-3">
          {alertVisible ? (
            <div className="flex items-start gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4 text-sm">
              <Icon name="question" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Файлы остаются на этом устройстве
                </p>
                <p className={`mt-1 ${kit.muted}`}>
                  Пример компонента не отправляет файлы на сервер.
                </p>
              </div>
              <Button
                variant="plain"
                className="min-h-11 shrink-0 px-3"
                aria-label="Скрыть сведения о файлах"
                onClick={() => setAlertVisible(false)}
              >
                <Icon name="x" />
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setAlertVisible(true)}>
              Показать сведения снова
            </Button>
          )}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4 text-sm">
            <span className="rounded-full bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
              <Icon name="check" />
            </span>
            <div>
              <p className="font-semibold">Можно проверять</p>
              <p className={`mt-1 ${kit.muted}`}>
                Сообщение об успехе называет завершённое действие.
              </p>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="toast"
        title="Всплывающее уведомление"
        description="Краткое подтверждение может предложить немедленную отмену."
        states={["Hidden", "Visible", "Undone", "Dismissed"]}
        usage="Важные сведения сохраняются и на странице. Пример скрывает уведомление через восемь секунд и приостанавливает таймер при наведении или фокусе. Отмена доступна и рядом с кнопкой запуска."
        recipe={`${kit.card} flex flex-wrap items-center gap-3 shadow-sm`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setToast("saved")}>
            Сымитировать сохранение черновика
          </Button>
          <Button
            variant="secondary"
            disabled={toast !== "saved"}
            onClick={() => setToast("undone")}
          >
            Отменить сохранение примера
          </Button>
        </div>
        <div className="mt-4 min-h-20" aria-live="polite" aria-atomic="true">
          {toast ? (
            <div
              className={`${kit.card} flex flex-wrap items-center gap-3 shadow-sm`}
              onPointerEnter={() => setToastHovered(true)}
              onPointerLeave={() => setToastHovered(false)}
              onFocusCapture={() => setToastFocused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setToastFocused(false);
                }
              }}
            >
              <Icon name="check" />
              <p className="min-w-0 flex-1 text-sm font-medium">
                {toast === "saved"
                  ? "Черновик сохранён внутри примера."
                  : "Сохранение примера отменено."}
              </p>
              {toast === "saved" ? (
                <Button variant="plain" onClick={() => setToast("undone")}>
                  Отменить
                </Button>
              ) : null}
              <Button
                variant="plain"
                className="px-3"
                aria-label="Закрыть уведомление"
                onClick={() => {
                  setToast(null);
                  setToastHovered(false);
                  setToastFocused(false);
                }}
              >
                <Icon name="x" />
              </Button>
            </div>
          ) : (
            <p className={`text-sm ${kit.muted}`}>
              Нет уведомления. За пределами примера ничего не сохранено.
            </p>
          )}
        </div>
      </Specimen>

      <Specimen
        id="loading"
        title="Загрузка и каркас"
        description="Локальный таймер показывает прогресс, сохраняя раскладку содержимого."
        states={["Idle", "Загрузка", "Complete", "Уменьшение движения"]}
        usage="Для неизвестного содержимого используйте каркас; измеримый прогресс — только при известном выполненном объёме."
        recipe="h-2 overflow-hidden rounded-full bg-[var(--workspace-brand-line)] / animate-pulse motion-reduce:animate-none"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${kit.card} space-y-4`}>
            <Button
              disabled={loading}
              onClick={() => {
                setProgress(0);
                setLoading(true);
              }}
            >
              {loading ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
                />
              ) : (
                <Icon name="arrow-right" />
              )}
              {loading ? "Simulating…" : "Запустить пример загрузки"}
            </Button>
            <progress
              className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-[var(--workspace-brand-primary)] [&::-webkit-progress-bar]:bg-[var(--workspace-brand-line)] [&::-webkit-progress-value]:bg-[var(--workspace-brand-primary)]"
              aria-label="Прогресс примера"
              max={100}
              value={progress}
            />
            <p role="status" className={`text-sm ${kit.muted}`}>
              {loading
                ? `${progress}% · локальный пример`
                : progress === 100
                  ? "Пример завершён."
                  : "Можно запустить пример."}
            </p>
          </div>
          <div
            className={`${kit.card} space-y-4`}
            aria-label="Пример каркаса"
            aria-busy={loading}
          >
            <div
              aria-hidden="true"
              className={
                loading
                  ? "space-y-4 animate-pulse motion-reduce:animate-none"
                  : "space-y-4"
              }
            >
              <div className="h-8 w-8 rounded-lg bg-[var(--workspace-brand-line)]" />
              <div className="h-3 w-2/3 rounded-full bg-[var(--workspace-brand-line)]" />
              <div className="h-3 w-full rounded-full bg-[var(--workspace-brand-background)]" />
              <div className="h-3 w-4/5 rounded-full bg-[var(--workspace-brand-background)]" />
            </div>
            <p className={`text-xs ${kit.muted}`}>
              Предпросмотр каркаса содержимого
            </p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="empty-error"
        title="Пустые состояния и ошибки"
        description="Объясните событие и предложите следующее полезное действие."
        states={["Пусто", "Ошибка", "Retrying", "Recovered"]}
        usage="Пустой коллекции нужно приглашение. Ошибке запроса — объяснение и повтор с сохранением работы."
        recipe={`${kit.card} grid justify-items-center gap-3 py-8 text-center; error: border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)]`}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setEmptyState("empty")}>
            Показать пустое состояние
          </Button>
          <Button variant="secondary" onClick={() => setEmptyState("error")}>
            Сымитировать ошибку
          </Button>
        </div>
        <div
          className={twMerge(
            kit.card,
            "grid justify-items-center gap-3 py-8 text-center",
            emptyState !== "empty" &&
              "border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)]",
          )}
          role={emptyState === "error" ? "alert" : undefined}
          aria-busy={emptyState === "retrying"}
        >
          <Icon
            name={emptyState === "empty" ? "folder-open" : "question"}
            size={24}
          />
          <p className="font-semibold">
            {emptyState === "empty"
              ? "В примере нет файлов"
              : emptyState === "error"
                ? "Пример не загрузился"
                : "Повторная загрузка примера…"}
          </p>
          <p
            role="status"
            className={`max-w-md text-sm ${emptyState === "empty" ? kit.muted : "text-[var(--workspace-brand-danger)]"}`}
          >
            {emptyState === "empty"
              ? "Добавьте локальный файл в примере загрузки ниже."
              : "Это имитация ошибки. Локальные файлы не изменились."}
          </p>
          {emptyState !== "empty" ? (
            <Button
              variant="secondary"
              className="border-[var(--workspace-brand-danger-line)] text-[var(--workspace-brand-danger)] enabled:hover:bg-[var(--workspace-brand-danger-surface)] focus-visible:outline-[var(--workspace-brand-danger)]"
              disabled={emptyState === "retrying"}
              onClick={() => setEmptyState("retrying")}
            >
              {emptyState === "retrying" ? "Retrying…" : "Повторить пример"}
            </Button>
          ) : null}
        </div>
      </Specimen>
    </div>
  );
}
