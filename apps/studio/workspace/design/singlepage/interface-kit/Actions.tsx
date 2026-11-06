import { useEffect, useId, useRef, useState } from "react";
import { Button, Icon, Specimen, kit } from "./primitives";
import { ConfirmationDialog } from "./Confirmation";

export default function Actions() {
  const groupId = useId();
  const [resetOpen, setResetOpen] = useState(false);
  const [notes, setNotes] = useState(0);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState("");
  const [size, setSize] = useState("Обычный");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function runLoadingDemo() {
    setLoading(true);
    setLoadingResult("");
    timer.current = setTimeout(() => {
      setLoading(false);
      setLoadingResult("Демонстрация загрузки завершена.");
    }, 1200);
  }

  return (
    <div className="grid gap-4">
      <Specimen
        id="actions"
        title="Действия"
        description="Одно лаймовое действие ведёт дальше. Вторичные и текстовые кнопки сдержанны; опасные действия отделены."
        states={[
          "default",
          "hover",
          "клавиатурный фокус",
          "disabled",
          "loading",
          "compact",
          "large",
          "icon-only",
        ]}
        usage="Кнопки действуют только в примере. У иконок есть доступные имена; загрузка сохраняет подпись и блокирует повторный запуск."
        recipe={`Primary: ${kit.button}\nSecondary: ${kit.secondary}\nPlain: ${kit.plain}\nDestructive: ${kit.danger}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setNotes((value) => value + 1)}>
            <Icon name="plus" />
            Добавить заметку
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreview((value) => !value)}
            aria-expanded={preview}
            aria-controls={`${groupId}-preview`}
          >
            <Icon name="eye" />
            {preview ? "Скрыть просмотр" : "Посмотреть заметки"}
          </Button>
          <Button
            variant="plain"
            onClick={() => setPreview(false)}
            disabled={!preview}
          >
            Отмена
          </Button>
          <Button disabled>Недоступно</Button>
        </div>
        <p className={`mt-4 text-sm ${kit.muted}`} role="status">
          Заметки, добавленные в примере: {notes}
        </p>
        <div
          id={`${groupId}-preview`}
          hidden={!preview}
          className={`mt-4 ${kit.card} bg-[var(--workspace-brand-background)]`}
        >
          <p className="text-sm font-semibold">Заметки проекта</p>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            {notes
              ? `${notes} sample ${notes === 1 ? "заметка" : "заметки"} готов к проверке.`
              : "Добавьте заметку, чтобы начать пример."}
          </p>
        </div>
        <div className="mt-6 grid gap-6 border-t border-[var(--workspace-brand-line)] pt-6 sm:grid-cols-2">
          <div>
            <h4 className={kit.label}>Размеры</h4>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                className="min-h-11 px-3 text-xs"
                onClick={() => setSize("Компактный")}
              >
                Компактный
              </Button>
              <Button variant="secondary" onClick={() => setSize("Обычный")}>
                Обычный
              </Button>
              <Button
                variant="secondary"
                className="min-h-14 px-6 text-base"
                onClick={() => setSize("Крупный")}
              >
                Крупный
              </Button>
              <Button
                variant="secondary"
                className="h-11 w-11 p-0"
                aria-label="Добавить пример заметки"
                onClick={() => setNotes((value) => value + 1)}
              >
                <Icon name="plus" />
              </Button>
            </div>
            <p className={`mt-3 text-xs ${kit.muted}`} role="status">
              Последний выбранный размер: {size}
            </p>
          </div>
          <div>
            <h4 className={kit.label}>Загрузка</h4>
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={runLoadingDemo}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <Icon name="gear-six" className="motion-safe:animate-spin" />
                ) : (
                  <Icon name="arrow-right" />
                )}
                {loading ? "Working…" : "Попробовать загрузку"}
              </Button>
            </div>
            <p className={`mt-3 min-h-5 text-xs ${kit.muted}`} role="status">
              {loadingResult || "Короткий пример локального состояния."}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t border-[var(--workspace-brand-line)] pt-5">
          <Button
            variant="danger"
            onClick={() => setResetOpen(true)}
            disabled={notes === 0 && !preview}
          >
            <Icon name="trash" />
            Сбросить заметки
          </Button>
        </div>
        <ConfirmationDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          title="Сбросить заметки?"
          description="Удалить все заметки этого примера и закрыть их просмотр."
          confirmLabel="Сбросить заметки"
          onConfirm={() => {
            setNotes(0);
            setPreview(false);
          }}
        />
      </Specimen>
    </div>
  );
}
