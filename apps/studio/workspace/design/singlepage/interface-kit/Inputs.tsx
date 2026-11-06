import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Slider from "@radix-ui/react-slider";
import { Command } from "cmdk";
import {
  Button,
  Checkbox,
  Icon,
  Select,
  Specimen,
  kit,
  picker,
} from "./primitives";

interface IFieldErrors {
  name?: string;
  email?: string;
}

interface IProjectOption {
  id: string;
  name: string;
  category: string;
}

const projects: IProjectOption[] = [
  { id: "coffee", name: "Обжарочная кофе", category: "Retail" },
  { id: "studio", name: "Творческая студия", category: "Services" },
  { id: "garden", name: "Общественный сад", category: "Community" },
  { id: "bakery", name: "Пекарня у дома", category: "Retail" },
];
const radio =
  "h-5 w-5 shrink-0 cursor-pointer accent-[var(--workspace-brand-foreground)] disabled:cursor-not-allowed disabled:opacity-50";
const switchTrack =
  "relative inline-flex h-6 w-11 shrink-0 rounded-full bg-[var(--workspace-brand-line)] p-0.5 transition motion-reduce:transition-none peer-checked:bg-[var(--workspace-brand-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--workspace-brand-focus)] peer-disabled:opacity-50";
const sliderRoot =
  "relative flex h-11 w-full touch-none select-none items-center data-[disabled]:opacity-50";
const sliderTrack =
  "relative h-1.5 grow rounded-full bg-[var(--workspace-brand-line)]";
const sliderThumb =
  "block h-6 w-6 rounded-full border-2 border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-surface)] disabled:cursor-not-allowed";
const comboboxPanel =
  "z-50 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2 text-[var(--workspace-brand-foreground)] shadow-lg";
const comboboxItem =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm outline-none data-[selected=true]:bg-[var(--workspace-brand-background)]";

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Введите контактную почту.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Используйте адрес вида you@example.com.";
  return undefined;
}

const segmentedTrack =
  "grid max-w-xl grid-cols-1 gap-1 rounded-2xl bg-[var(--workspace-brand-background)] p-1.5 sm:grid-cols-3";
const segment =
  "group relative grid min-h-12 min-w-0 cursor-pointer place-items-center rounded-xl px-1 py-2 text-sm font-medium text-[var(--workspace-brand-muted)] transition motion-reduce:transition-none hover:text-[var(--workspace-brand-foreground)] has-[:checked]:bg-[var(--workspace-brand-surface)] has-[:checked]:text-[var(--workspace-brand-foreground)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--workspace-brand-focus)]";
const choiceTrack =
  "grid gap-2 rounded-2xl bg-[var(--workspace-brand-background)] p-1.5 sm:grid-cols-2";
const choiceCard =
  "group flex min-h-32 min-w-0 cursor-pointer flex-col rounded-xl border border-transparent bg-[var(--workspace-brand-background)] p-4 text-sm text-[var(--workspace-brand-muted)] transition motion-reduce:transition-none hover:text-[var(--workspace-brand-foreground)] has-[:checked]:border-[var(--workspace-brand-foreground)]/20 has-[:checked]:bg-[var(--workspace-brand-surface)] has-[:checked]:text-[var(--workspace-brand-foreground)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--workspace-brand-focus)]";

function Selection() {
  const groupId = useId();
  const [material, setMaterial] = useState("Заметки");
  const [startingPoint, setStartingPoint] = useState("files");
  return (
    <Specimen
      id="selection"
      title="Выбор"
      guidance={
        <>
          <SurfacePatternGuidance title="Choice group" />
          <SurfacePatternGuidance title="Settings section" />
        </>
      }
      description="Белая выбранная поверхность внутри холодной серой полосы. Фиксированные места и маленькие лаймовые отметки сохраняют геометрию."
      states={[
        "unselected",
        "выбрано",
        "hover",
        "клавиатурный фокус",
        "друг под другом на узком экране",
      ]}
      usage="Use a segmented group for short alternatives and choice cards when an option needs a description. Native radios support arrow-key navigation."
      recipe={`Сегментированный переключатель: ${segmentedTrack}\nSegment: ${segment}
Сетка выбора: ${choiceTrack}
Карточка выбора: ${choiceCard}`}
    >
      <fieldset>
        <legend className={`${kit.label} mb-3`}>Тип материала</legend>
        <div className={segmentedTrack}>
          {["Заметки", "Документы", "Изображения"].map((option) => (
            <label key={option} className={segment}>
              <input
                type="radio"
                className="sr-only"
                name={`${groupId}-material`}
                value={option}
                checked={material === option}
                onChange={() => setMaterial(option)}
              />
              <span>{option}</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[var(--workspace-brand-accent)] opacity-0 transition motion-reduce:transition-none group-has-[:checked]:opacity-100"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className={`${kit.label} mb-3`}>Отправная точка</legend>
        <div className={choiceTrack}>
          {[
            {
              value: "files",
              title: "Использовать мои файлы",
              description: "Добавьте заметки, документы и изображения.",
            },
            {
              value: "direct",
              title: "Записать известное",
              description: "Добавьте факты о проекте напрямую.",
            },
          ].map((option) => (
            <label key={option.value} className={choiceCard}>
              <input
                type="radio"
                className="sr-only"
                name={`${groupId}-starting-point`}
                value={option.value}
                checked={startingPoint === option.value}
                onChange={() => setStartingPoint(option.value)}
              />
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{option.title}</span>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-on-accent)] transition motion-reduce:transition-none group-has-[:checked]:border-transparent group-has-[:checked]:bg-[var(--workspace-brand-accent)]">
                  <Icon
                    name="check"
                    className="h-4 w-4 opacity-0 group-has-[:checked]:opacity-100"
                  />
                </span>
              </span>
              <span className={`mt-2 text-sm leading-[22px] ${kit.muted}`}>
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={`mt-4 text-xs ${kit.muted}`} role="status">
        Выбрано: {material} ·{" "}
        {startingPoint === "files" ? "Существующие файлы" : "Записать напрямую"}
      </p>
    </Specimen>
  );
}

function Fields() {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("Coffee roastery");
  const [email, setEmail] = useState("hello");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("demo-password");
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<IFieldErrors>({
    email: "Используйте адрес вида you@example.com.",
  });
  const [saved, setSaved] = useState("");
  const matches = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : "Введите название проекта.",
      email: validateEmail(email),
    };
    setErrors(nextErrors);
    setSaved("");
    if (nextErrors.name) return nameRef.current?.focus();
    if (nextErrors.email) return emailRef.current?.focus();
    setSaved(`${name.trim()} обновлён в этом примере.`);
  }

  return (
    <Specimen
      id="fields"
      title="Поля и строки данных"
      guidance={
        <SurfacePatternGuidance
          title="Step form"
          context="Применяйте правило к форме из нескольких шагов."
        />
      }
      description="Подписи, пояснения и ошибки рядом с полем. Форма проверяет и сохраняет значения внутри примера."
      states={[
        "default",
        "filled",
        "required",
        "invalid",
        "focus",
        "read-only",
        "disabled",
        "пароль виден",
        "search",
        "сохранено локально",
      ]}
      usage="Required and invalid states are named in text. Errors use aria-describedby and aria-invalid; submitting focuses the first invalid field. Read-only values remain selectable."
      recipe={`Field: ${kit.field}\nLabel: ${kit.label}\nError: text-sm text-[var(--workspace-brand-danger)]\nRow: flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3`}
    >
      <form noValidate onSubmit={submit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={kit.label} htmlFor={`${id}-name`}>
              Название проекта{" "}
              <span className={`font-normal ${kit.muted}`}>(обязательно)</span>
            </label>
            <input
              ref={nameRef}
              id={`${id}-name`}
              className={`mt-2 ${kit.field}`}
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((value) => ({ ...value, name: undefined }));
                setSaved("");
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? `${id}-name-error` : `${id}-name-help`
              }
            />
            {errors.name ? (
              <p
                id={`${id}-name-error`}
                className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
                role="alert"
              >
                {errors.name}
              </p>
            ) : (
              <p id={`${id}-name-help`} className={`mt-2 text-xs ${kit.muted}`}>
                Название, по которому команда узнаёт проект.
              </p>
            )}
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-email`}>
              Контактная почта{" "}
              <span className={`font-normal ${kit.muted}`}>(обязательно)</span>
            </label>
            <input
              ref={emailRef}
              id={`${id}-email`}
              className={`mt-2 ${kit.field}`}
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((value) => ({ ...value, email: undefined }));
                setSaved("");
              }}
              onBlur={() =>
                setErrors((value) => ({
                  ...value,
                  email: validateEmail(email),
                }))
              }
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? `${id}-email-error` : `${id}-email-help`
              }
            />
            {errors.email ? (
              <p
                id={`${id}-email-error`}
                className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
                role="alert"
              >
                {errors.email}
              </p>
            ) : (
              <p
                id={`${id}-email-help`}
                className={`mt-2 text-xs ${kit.muted}`}
              >
                Этот пример не отправляет письма.
              </p>
            )}
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-readonly`}>
              ID Workspace · только чтение
            </label>
            <input
              id={`${id}-readonly`}
              className={`mt-2 ${kit.field}`}
              value="SPS-014"
              readOnly
            />
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-disabled`}>
              Ссылка приглашения · недоступна
            </label>
            <input
              id={`${id}-disabled`}
              className={`mt-2 ${kit.field}`}
              value="Unavailable in this preview"
              disabled
              readOnly
            />
          </div>
        </div>
        <div>
          <label className={kit.label} htmlFor={`${id}-notes`}>
            Заметки проекта{" "}
            <span className={`font-normal ${kit.muted}`}>(необязательно)</span>
          </label>
          <textarea
            id={`${id}-notes`}
            className={`mt-2 min-h-28 resize-y ${kit.field}`}
            placeholder="Добавьте контекст для следующего участника."
            value={notes}
            maxLength={500}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved("");
            }}
            aria-describedby={`${id}-notes-help`}
          />
          <p id={`${id}-notes-help`} className={`mt-2 text-xs ${kit.muted}`}>
            {notes.length} / 500 characters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">
            <Icon name="check" />
            Сохранить в примере
          </Button>
          <p className={`text-sm ${kit.muted}`} role="status">
            {saved}
          </p>
        </div>
      </form>
      <div className="mt-6 grid gap-5 border-t border-[var(--workspace-brand-line)] pt-6 md:grid-cols-2">
        <div>
          <label className={kit.label} htmlFor={`${id}-password`}>
            Пароль примера
          </label>
          <div className="relative mt-2">
            <input
              id={`${id}-password`}
              className={`${kit.field} pr-14`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
            />
            <Button
              variant="plain"
              className="absolute top-1 right-1 h-10 min-h-10 w-10 p-0"
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              <Icon name="eye" />
            </Button>
          </div>
        </div>
        <div>
          <label className={kit.label} htmlFor={`${id}-search`}>
            Поиск примеров проектов
          </label>
          <input
            id={`${id}-search`}
            className={`mt-2 ${kit.field}`}
            type="search"
            placeholder="Попробуйте «кофе»"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-describedby={`${id}-search-results`}
          />
          <p
            id={`${id}-search-results`}
            className={`mt-2 text-xs ${kit.muted}`}
            role="status"
          >
            {matches.length
              ? matches.map((project) => project.name).join(" · ")
              : "Проекты не найдены."}
          </p>
        </div>
      </div>
      <dl className="mt-6 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
          <dt className={kit.muted}>Проект</dt>
          <dd>{name || "Untitled"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
          <dt className={kit.muted}>Видимость</dt>
          <dd>Частный просмотр</dd>
        </div>
      </dl>
    </Specimen>
  );
}

function Choices() {
  const id = useId();
  const masterRef = useRef<HTMLInputElement>(null);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [notifications, setNotifications] = useState(true);
  const allChecked = emailUpdates && weeklyDigest;
  const mixed = emailUpdates !== weeklyDigest;

  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = mixed;
  }, [mixed]);

  return (
    <Specimen
      id="choices"
      title="Флажки, радио и переключатели"
      description="Флажки объединяют независимые варианты, радио выбирает одно значение, переключатель включает или выключает настройку."
      states={[
        "unchecked",
        "checked",
        "indeterminate",
        "disabled",
        "клавиатурный фокус",
        "выключено",
        "включено",
      ]}
      usage="Флажок использует Phosphor 14px внутри поля 20px. Вся подпись нажимается. Общий флажок показывает частичный выбор, переключатели сообщают checked и реагируют на Space."
      recipe={`Checkbox: ${kit.checkbox} ${kit.focus}\nRadio: ${radio} ${kit.focus}
Дорожка переключателя: ${switchTrack}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Обновления</legend>
          <div className="grid gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <Checkbox
                ref={masterRef}
                checked={allChecked}
                aria-checked={mixed ? "mixed" : allChecked}
                onChange={() => {
                  setEmailUpdates(!allChecked);
                  setWeeklyDigest(!allChecked);
                }}
              />
              Все обновления
            </label>
            <div className="grid gap-2 border-t border-[var(--workspace-brand-line)] pt-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={emailUpdates}
                  onChange={(event) => setEmailUpdates(event.target.checked)}
                />
                Обновления проекта
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={weeklyDigest}
                  onChange={(event) => setWeeklyDigest(event.target.checked)}
                />
                Еженедельная подборка
              </label>
              <label
                className={`flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
              >
                <Checkbox disabled />
                Недоступный вариант
              </label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Плотность отображения</legend>
          <div className="grid gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name={`${id}-density`}
                value="comfortable"
                className={`${radio} ${kit.focus}`}
                checked={density === "comfortable"}
                onChange={() => setDensity("comfortable")}
              />
              Просторный
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name={`${id}-density`}
                value="compact"
                className={`${radio} ${kit.focus}`}
                checked={density === "compact"}
                onChange={() => setDensity("compact")}
              />
              Компактный
            </label>
            <label
              className={`flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
            >
              <input
                type="radio"
                name={`${id}-density`}
                value="custom"
                className={`${radio} ${kit.focus}`}
                disabled
              />
              Свой · недоступен
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Уведомления</legend>
          <label className="group flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
            />
            <span className={switchTrack} aria-hidden="true">
              <span className="h-5 w-5 rounded-full bg-[var(--workspace-brand-surface)] transition motion-reduce:transition-none group-has-[:checked]:translate-x-5 group-has-[:checked]:bg-[var(--workspace-brand-on-accent)]" />
            </span>
            Уведомлять меня
          </label>
          <label
            className={`mt-3 flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
          >
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              disabled
            />
            <span className={switchTrack} aria-hidden="true">
              <span className="h-5 w-5 rounded-full bg-[var(--workspace-brand-surface)]" />
            </span>
            Недоступный переключатель
          </label>
        </fieldset>
      </div>
      <p className={`mt-5 text-xs ${kit.muted}`} role="status">
        {Number(emailUpdates) + Number(weeklyDigest)} типов обновлений выбрано ·{" "}
        {density} раскладка · уведомления {notifications ? "on" : "off"}
      </p>
    </Specimen>
  );
}

function Combobox() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState(projects[0]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("Project model");

  return (
    <Specimen
      id="combobox"
      title="Выбор с поиском"
      description="Для короткого фиксированного списка подходит селектор; для поиска варианта — поле с поиском."
      states={[
        "closed",
        "open",
        "search",
        "клавиатурное выделение",
        "выбрано",
        "нет результатов",
        "disabled",
      ]}
      usage="Select использует shadcn Radix: отступы списка, выделение строки, отметка выбора и недоступные варианты. Оба выбора имеют поля 48px и стрелку Phosphor. Откройте список, используйте стрелки и Enter. В выборе проекта можно печатать для поиска. Escape закрывает список и возвращает фокус."
      recipe={`Trigger: ${picker.trigger}
Содержимое списка: ${picker.content}
Элемент списка: ${picker.item}\nPopover: ${comboboxPanel}\nOption: ${comboboxItem}`}
    >
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <label className={kit.label} htmlFor={`${id}-view`}>
            Рабочий вид
          </label>
          <Select
            id={`${id}-view`}
            className="mt-2"
            value={view}
            onValueChange={setView}
            options={[
              { value: "Project model", label: "Модель проекта" },
              {
                value: "Landing-page preview",
                label: "Предпросмотр посадочной",
              },
              { value: "Файлы", label: "Files" },
              {
                value: "Calendar",
                label: "Календарь · недоступен",
                disabled: true,
              },
            ]}
          />
          <label
            className={`mt-5 block ${kit.label}`}
            htmlFor={`${id}-disabled-view`}
          >
            Недоступный селектор
          </label>
          <Select
            id={`${id}-disabled-view`}
            className="mt-2"
            disabled
            defaultValue="Workspace locked"
            options={[
              { value: "Workspace locked", label: "Workspace заблокирован" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className={kit.label} htmlFor={`${id}-project`}>
            Проект
          </label>
          <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) setQuery("");
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                id={`${id}-project`}
                className={`mt-2 ${picker.trigger}`}
                aria-label={`Project: ${project.name}`}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? `${id}-options` : undefined}
              >
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                <Icon name="caret-down" className={picker.icon} />
              </button>
            </Popover.Trigger>
            <Popover.Content
              align="start"
              sideOffset={8}
              className={comboboxPanel}
            >
              <Command label="Примеры проектов">
                <Command.Input
                  className={kit.field}
                  placeholder="Поиск проектов…"
                  aria-label="Поиск проектов"
                  value={query}
                  onValueChange={setQuery}
                />
                <Command.List
                  id={`${id}-options`}
                  className="mt-2 max-h-64 overflow-y-auto overscroll-contain"
                >
                  <Command.Empty className={`px-3 py-5 text-sm ${kit.muted}`}>
                    Нет проектов по запросу «{query}”.
                  </Command.Empty>
                  {projects.map((option) => (
                    <Command.Item
                      key={option.id}
                      value={option.name}
                      className={comboboxItem}
                      onSelect={() => {
                        setProject(option);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{option.name}</span>
                        <span className={`mt-1 block text-xs ${kit.muted}`}>
                          {option.category}
                        </span>
                      </span>
                      <Icon
                        name="check"
                        className={
                          option.id === project.id ? "opacity-100" : "opacity-0"
                        }
                      />
                    </Command.Item>
                  ))}
                </Command.List>
              </Command>
            </Popover.Content>
          </Popover.Root>
          <p className={`mt-3 text-xs ${kit.muted}`}>
            Поиск ограничен четырьмя примерами проектов.
          </p>
        </div>
      </div>
      <p className={`mt-5 text-sm ${kit.muted}`} role="status">
        {project.name} · {view}
      </p>
    </Specimen>
  );
}

function DateAndTime() {
  const id = useId();
  const [date, setDate] = useState("2026-10-04");
  const [time, setTime] = useState("09:30");
  const [dateTime, setDateTime] = useState("2026-10-04T09:30");

  return (
    <Specimen
      id="date-time"
      title="Дата и время"
      description="Нативные поля даты и времени сохраняют привычный выбор браузера и редактирование с клавиатуры."
      states={[
        "filled",
        "empty",
        "focus",
        "disabled",
        "границы дат",
        "шаг времени 15 минут",
      ]}
      usage="Это локальные значения примера. В реальном расписании укажите часовой пояс: datetime-local его не хранит."
      recipe={kit.field}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-date`} className={kit.label}>
            Плановая дата
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={`mt-2 ${kit.field}`}
            min="2026-01-01"
            max="2030-12-31"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-describedby={`${id}-date-help`}
          />
          <p id={`${id}-date-help`} className={`mt-2 text-xs ${kit.muted}`}>
            Выберите дату между 2026 и 2030 годами.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-time`} className={kit.label}>
            Время начала
          </label>
          <input
            id={`${id}-time`}
            type="time"
            step={900}
            className={`mt-2 ${kit.field}`}
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
          <p className={`mt-2 text-xs ${kit.muted}`}>Шаг 15 минут</p>
        </div>
        <div>
          <label htmlFor={`${id}-combined`} className={kit.label}>
            Дата и время
          </label>
          <input
            id={`${id}-combined`}
            type="datetime-local"
            className={`mt-2 ${kit.field}`}
            value={dateTime}
            onChange={(event) => setDateTime(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-disabled`} className={kit.label}>
            Недоступная дата
          </label>
          <input
            id={`${id}-disabled`}
            type="date"
            className={`mt-2 ${kit.field}`}
            value="2026-10-04"
            disabled
            readOnly
          />
        </div>
      </div>
      <p className={`mt-5 text-sm ${kit.muted}`} role="status">
        Выбрано: {date || "Нет даты"} · {time || "Нет времени"} ·{" "}
        {dateTime ? dateTime.replace("T", " at ") : "Нет совмещённого значения"}
      </p>
    </Specimen>
  );
}

function RangeAndSlider() {
  const id = useId();
  const [zoom, setZoom] = useState([60]);
  const [range, setRange] = useState([2, 8]);

  return (
    <Specimen
      id="range"
      title="Диапазон и ползунок"
      description="Ползунок объединяет видимое значение с просторной целью указателя. У диапазона два подписанных бегунка."
      states={[
        "default",
        "dragging",
        "клавиатурный фокус",
        "minimum",
        "maximum",
        "два бегунка",
        "disabled",
      ]}
      usage="Стрелки — один шаг, Page Up/Down — большой шаг, Home/End — границы. При двух значениях на полосе подпишите каждый бегунок."
      recipe={`Root: ${sliderRoot}\nTrack: ${sliderTrack}\nThumb: ${sliderThumb} ${kit.focus}`}
    >
      <div className="grid gap-7 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span id={`${id}-zoom`} className={kit.label}>
              Масштаб просмотра
            </span>
            <output className="text-sm tabular-nums">{zoom[0]}%</output>
          </div>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            min={25}
            max={100}
            step={5}
            value={zoom}
            onValueChange={setZoom}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-accent)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-labelledby={`${id}-zoom`}
              aria-valuetext={`${zoom[0]} percent`}
            />
          </Slider.Root>
          <div className={`flex justify-between text-xs ${kit.muted}`}>
            <span>25%</span>
            <span>100%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={kit.label}>Диапазон разделов</span>
            <output className="text-sm tabular-nums">
              {range[0]}–{range[1]}
            </output>
          </div>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            min={1}
            max={12}
            step={1}
            minStepsBetweenThumbs={1}
            value={range}
            onValueChange={setRange}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-accent)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-label="Первый раздел"
            />
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-label="Последний раздел"
            />
          </Slider.Root>
          <div className={`flex justify-between text-xs ${kit.muted}`}>
            <span>1</span>
            <span>12</span>
          </div>
        </div>
        <div>
          <span id={`${id}-disabled`} className={kit.label}>
            Недоступный ползунок
          </span>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            disabled
            defaultValue={[40]}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-muted)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-labelledby={`${id}-disabled`}
            />
          </Slider.Root>
        </div>
      </div>
    </Specimen>
  );
}

export default function Inputs() {
  return (
    <div className="grid gap-4">
      <Fields />
      <Selection />
      <Choices />
      <Combobox />
      <DateAndTime />
      <RangeAndSlider />
    </div>
  );
}
