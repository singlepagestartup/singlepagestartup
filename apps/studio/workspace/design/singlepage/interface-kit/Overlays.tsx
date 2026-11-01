import { useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Command } from "cmdk";
import { Button, Checkbox, Icon, kit, Specimen } from "./primitives";

export default function Overlays() {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [name, setName] = useState("Пример Studio");
  const [draftName, setDraftName] = useState(name);
  const [deleted, setDeleted] = useState(false);
  const [compact, setCompact] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [menuResult, setMenuResult] = useState("Действие не выбрано.");
  const [commandResult, setCommandResult] = useState("Команда не выбрана.");
  const nameId = useId();
  const nameErrorId = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  const commandInput = useRef<HTMLInputElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const invalidName = !draftName.trim();
  const overlay = "fixed inset-0 z-50 bg-[var(--workspace-brand-primary)]/35";
  const content =
    "fixed left-1/2 top-1/2 z-[60] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl focus:outline-none";
  const floating =
    "z-[60] max-w-[calc(100vw_-_2rem)] rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-lg";
  const menuItem =
    "flex min-h-11 cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40";

  return (
    <div className="grid gap-6">
      <Specimen
        id="dialog"
        title="Диалог"
        description="Одна правка с явным сохранением или отменой."
        states={["Закрыто", "Открыть", "Ошибка ввода", "Сохранено", "Отмена"]}
        usage="Модальный диалог — для одной задачи. Фокус входит внутрь и возвращается к вызвавшему элементу; Escape отменяет."
        recipe={content}
      >
        <p className={`mb-4 text-sm ${kit.muted}`}>
          Локальное имя Workspace:{" "}
          <span className="font-semibold text-[var(--workspace-brand-foreground)]">
            {name}
          </span>
        </p>
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary" onClick={() => setDraftName(name)}>
              <Icon name="pencil-simple" />
              Изменить имя примера
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content
                className={content}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  nameInput.current?.focus();
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <Dialog.Title className="text-2xl font-semibold">
                    Изменить имя Workspace
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Закрыть диалог имени"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                  Меняется только имя в этом примере.
                </Dialog.Description>
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draftName.trim()) {
                      setName(draftName.trim());
                      setDialogOpen(false);
                    }
                  }}
                >
                  <label className={kit.label} htmlFor={nameId}>
                    Имя Workspace
                  </label>
                  <input
                    ref={nameInput}
                    id={nameId}
                    className={kit.field}
                    required
                    maxLength={60}
                    value={draftName}
                    aria-invalid={invalidName}
                    aria-describedby={invalidName ? nameErrorId : undefined}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                  {invalidName ? (
                    <p
                      id={nameErrorId}
                      role="alert"
                      className="text-sm text-[var(--workspace-brand-danger)]"
                    >
                      Введите имя Workspace.
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button variant="secondary">Отмена</Button>
                    </Dialog.Close>
                    <Button type="submit" disabled={!draftName.trim()}>
                      Сохранить локальное имя
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
      </Specimen>

      <Specimen
        id="confirmation"
        title="Диалог подтверждения"
        description="Назовите объект и последствия перед опасным действием."
        states={[
          "Готово",
          "Подтверждение",
          "Отмена",
          "Удалено",
          "Восстановлено",
        ]}
        usage="Диалог предупреждения нужен для последствия, требующего явного согласия. Начальный фокус — на отмене."
        recipe={`${content} / ${kit.danger}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--workspace-brand-line)] p-4">
          <p role="status" className="text-sm">
            {deleted
              ? "Черновик примера удалён."
              : "Черновик: первые заметки проекта"}
          </p>
          {deleted ? (
            <Button
              ref={restoreButton}
              variant="secondary"
              onClick={() => setDeleted(false)}
            >
              Восстановить черновик примера
            </Button>
          ) : (
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <Button variant="danger">
                  <Icon name="trash" />
                  Убрать черновик
                </Button>
              </AlertDialog.Trigger>
              {portal ? (
                <AlertDialog.Portal container={portal}>
                  <AlertDialog.Overlay className={overlay} />
                  <AlertDialog.Content
                    className={content}
                    onCloseAutoFocus={(event) => {
                      if (restoreButton.current) {
                        event.preventDefault();
                        restoreButton.current.focus();
                      }
                    }}
                  >
                    <AlertDialog.Title className="text-2xl font-semibold">
                      Убрать этот черновик примера?
                    </AlertDialog.Title>
                    <AlertDialog.Description
                      className={`mt-3 text-sm leading-relaxed ${kit.muted}`}
                    >
                      «Первые заметки проекта» исчезнут из примера. Настоящий
                      файл не удаляется.
                    </AlertDialog.Description>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <Button variant="secondary">Отмена</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button
                          variant="danger"
                          onClick={() => setDeleted(true)}
                        >
                          Убрать черновик примера
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              ) : null}
            </AlertDialog.Root>
          )}
        </div>
      </Specimen>

      <Specimen
        id="sheet"
        title="Выдвижная панель"
        description="Вторичные настройки открываются рядом с текущей рабочей областью."
        states={["Закрыто", "Открыть", "Изменено"]}
        usage="Задача остаётся видна за панелью. Фокус и Escape работают как в модальном диалоге."
        recipe="fixed inset-y-0 right-0 z-[60] w-full max-w-md overflow-y-auto border-l border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
      >
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Icon name="gear-six" />
              Открыть настройки примера
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl focus:outline-none">
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-2xl font-semibold">
                    Настройки примера
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Закрыть настройки примера"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-3 text-sm ${kit.muted}`}>
                  Элементы меняют локальные настройки примера.
                </Dialog.Description>
                <label className="mt-8 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--workspace-brand-line)] p-4 text-sm">
                  <span>Уведомления примера</span>
                  <Checkbox
                    checked={notifications}
                    onChange={(event) => setNotifications(event.target.checked)}
                  />
                </label>
                <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
                  Уведомления {notifications ? "on" : "off"} в этом примере.
                </p>
                <Dialog.Close asChild>
                  <Button className="mt-8 self-start">Готово</Button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
      </Specimen>

      <Specimen
        id="popover"
        title="Всплывающий блок и подсказка"
        description="Небольшой выбор и короткое пояснение остаются рядом с вызвавшим элементом."
        states={["Закрыто", "Открыть", "В фокусе", "Выбрано"]}
        usage="Интерактивное содержимое — во всплывающем блоке. Подсказка только дополняет доступную подпись кнопки."
        recipe={`${floating} / ${menuItem}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button variant="secondary">
                Параметры вида
                <Icon name="arrow-down" />
              </Button>
            </Popover.Trigger>
            {portal ? (
              <Popover.Portal container={portal}>
                <Popover.Content
                  align="start"
                  sideOffset={8}
                  className={`${floating} w-64 p-4`}
                  aria-label="Параметры вида"
                >
                  <h4 className="text-sm font-semibold">
                    Плотность отображения
                  </h4>
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm">
                    Компактные строки
                    <Checkbox
                      checked={compact}
                      onChange={(event) => setCompact(event.target.checked)}
                    />
                  </label>
                  <Popover.Close asChild>
                    <Button variant="plain" className="mt-2 w-full">
                      Готово
                    </Button>
                  </Popover.Close>
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="plain"
                  className="px-3"
                  aria-label="О плотности отображения"
                >
                  <Icon name="question" />
                </Button>
              </Tooltip.Trigger>
              {portal ? (
                <Tooltip.Portal container={portal}>
                  <Tooltip.Content
                    sideOffset={8}
                    className={`${floating} max-w-xs px-3 py-2 text-xs`}
                  >
                    Плотность меняет интервалы, сохраняя сведения.
                  </Tooltip.Content>
                </Tooltip.Portal>
              ) : null}
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--workspace-brand-line)] text-sm">
          <div className={compact ? "px-4 py-2" : "px-4 py-4"}>
            Обзор проекта
          </div>
          <div
            className={`${compact ? "px-4 py-2" : "px-4 py-4"} border-t border-[var(--workspace-brand-line)]`}
          >
            Справочные материалы
          </div>
        </div>
      </Specimen>

      <Specimen
        id="menu"
        title="Выпадающее меню"
        description="Компактный набор действий использует нативную клавиатурную навигацию меню."
        states={["Закрыто", "Открыть", "Подсвечено", "Отключено", "Выбрано"]}
        usage="Подписывайте действия и отделяйте опасные операции. Стрелки перемещают выбор; Escape возвращает к вызвавшему элементу."
        recipe={`${floating} / ${menuItem}`}
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary">
              Действия примера
              <Icon name="arrow-down" />
            </Button>
          </DropdownMenu.Trigger>
          {portal ? (
            <DropdownMenu.Portal container={portal}>
              <DropdownMenu.Content
                className={`${floating} min-w-56`}
                align="start"
                sideOffset={8}
              >
                <DropdownMenu.Label
                  className={`px-3 py-2 text-xs ${kit.muted}`}
                >
                  Локальный просмотр
                </DropdownMenu.Label>
                <DropdownMenu.Item
                  className={menuItem}
                  onSelect={() =>
                    setMenuResult("Копия создана внутри примера.")
                  }
                >
                  <Icon name="plus" />
                  Дублировать пример
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItem}
                  onSelect={() => setMenuResult("Пример отмечен для проверки.")}
                >
                  <Icon name="check" />
                  Отметить для проверки
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItem} disabled>
                  <Icon name="globe" />
                  Публикация недоступна
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--workspace-brand-line)]" />
                <DropdownMenu.Item
                  className={`${menuItem} text-[var(--workspace-brand-danger)] data-[highlighted]:bg-[var(--workspace-brand-danger-surface)]`}
                  onSelect={() => setMenuResult("Копия убрана из примера.")}
                >
                  <Icon name="trash" />
                  Убрать копию примера
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          ) : null}
        </DropdownMenu.Root>
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {menuResult}
        </p>
      </Specimen>

      <Specimen
        id="command"
        title="Поиск команд"
        description="Найдите команду в небольшом списке и выберите клавиатурой."
        states={["Закрыто", "Поиск", "Найдено", "Нет результатов", "Выбрано"]}
        usage="Команды обозначают известные действия. Стрелки выбирают результат, Enter запускает локальный пример."
        recipe={`${content} / ${kit.field} / ${menuItem}`}
      >
        <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Icon name="arrow-right" />
              Найти команду примера
            </Button>
          </Dialog.Trigger>
          {portal ? (
            <Dialog.Portal container={portal}>
              <Dialog.Overlay className={overlay} />
              <Dialog.Content
                className={content}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  commandInput.current?.focus();
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Найти команду
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="plain"
                      className="px-3"
                      aria-label="Закрыть поиск команд"
                    >
                      <Icon name="x" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                  Команды сообщают о выборе в локальном примере.
                </Dialog.Description>
                <Command className="mt-5" label="Команды примера">
                  <Command.Input
                    ref={commandInput}
                    className={kit.field}
                    placeholder="Поиск команд…"
                    aria-label="Поиск команд примера"
                  />
                  <Command.List className="mt-3 max-h-64 overflow-y-auto">
                    <Command.Empty
                      className={`px-3 py-6 text-center text-sm ${kit.muted}`}
                    >
                      Команды не найдены.
                    </Command.Empty>
                    {[
                      ["Открыть обзор проекта", "folder-open"],
                      ["Создать черновик", "plus"],
                      ["Проверить файлы референсов", "file-text"],
                    ].map(([label, icon]) => (
                      <Command.Item
                        key={label}
                        value={label}
                        onSelect={() => {
                          setCommandResult(
                            `Selected: ${label}. Только локальный пример.`,
                          );
                          setCommandOpen(false);
                        }}
                        className={`${menuItem} data-[selected=true]:bg-[var(--workspace-brand-background)]`}
                      >
                        <Icon
                          name={icon as "folder-open" | "plus" | "file-text"}
                        />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </Dialog.Root>
        <p role="status" className={`mt-4 text-sm ${kit.muted}`}>
          {commandResult}
        </p>
      </Specimen>
      <div
        ref={setPortal}
        className="contents"
        data-interface-kit-portals="overlays"
      />
    </div>
  );
}
