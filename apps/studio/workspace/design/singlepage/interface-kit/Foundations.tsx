import { useId, useState } from "react";
import { Button, Icon, Specimen, kit, type IconName } from "./primitives";
import { StarFilled } from "../../../utils/components/ModuleIcons";
import { IconRules } from "../../../utils/components/InterfaceGuidance";

const icons: { name: IconName; label: string }[] = [
  { name: "arrow-right", label: "Вперёд" },
  { name: "arrow-down", label: "Вниз" },
  { name: "caret-down", label: "Раскрыть выбор" },
  { name: "arrow-up-right", label: "Открыть ссылку" },
  { name: "file-text", label: "Файл" },
  { name: "folder-open", label: "Папка" },
  { name: "check", label: "Подтвердить" },
  { name: "x", label: "Закрыть" },
  { name: "stack", label: "Слои" },
  { name: "globe", label: "Сайт" },
  { name: "chat-circle", label: "Чат" },
  { name: "plus", label: "Добавить" },
  { name: "pencil-simple", label: "Изменить" },
  { name: "eye", label: "Просмотр" },
  { name: "upload-simple", label: "Загрузить" },
  { name: "gear-six", label: "Настройки" },
  { name: "trash", label: "Удалить" },
  { name: "question", label: "Помощь" },
  { name: "star", label: "Рейтинг · контур" },
];
const iconGrid = "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6";
const darkSurface =
  "rounded-2xl bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] sm:p-6 [--workspace-brand-background:#18232A] [--workspace-brand-surface:#24323B] [--workspace-brand-foreground:#FFFFFF] [--workspace-brand-muted:#C4CDD3] [--workspace-brand-line:#44525C] [--workspace-brand-focus:#FFFFFF]";

export default function Foundations() {
  const nameId = useId();
  const [name, setName] = useState("Обжарка кофе");
  const [savedName, setSavedName] = useState("");

  return (
    <div className="grid gap-4">
      <Specimen
        id="icons"
        title="Иконки"
        description="Галерея иконок навигации, действий и состояний."
        states={[
          "20px в управлении",
          "24px в карточке",
          "наследуемый цвет",
          "декоративный SVG",
        ]}
        usage="Размер иконок фиксирован, центр выровнен с текстом. Галочка 14px внутри флажка 20px, галочка 16px внутри отметки выбора 24px. Декоративные SVG скрыты от вспомогательных технологий; кнопке-иконке нужно доступное имя. Геометрия официальная."
        recipe={`Gallery: ${iconGrid}\n20px: h-5 w-5 shrink-0\n24px: h-6 w-6 shrink-0\nSVG: viewBox=\"0 0 256 256\" fill=\"currentColor\" aria-hidden=\"true\"`}
      >
        <IconRules />
        <p className={`my-5 text-sm ${kit.muted}`}>
          <a
            href="https://github.com/phosphor-icons/core/tree/2b75f3ad12b420c9504ef05df8d2564a28f8500e"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-sm underline underline-offset-4 ${kit.focus}`}
          >
            Официальная библиотека
          </a>
          {" · "}
          <a
            href="/workspace-assets/singlepage/icons/phosphor/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-sm underline underline-offset-4 ${kit.focus}`}
          >
            Лицензия MIT
          </a>
        </p>
        <div className={iconGrid}>
          {icons.map((icon) => (
            <div
              key={icon.name}
              className="rounded-xl bg-[var(--workspace-brand-background)] px-4 py-4"
            >
              <div className="flex h-6 items-center gap-3">
                <Icon name={icon.name} />
                <Icon name={icon.name} size={24} />
              </div>
              <p className="mt-3 text-xs font-medium">{icon.label}</p>
              <p className={`mt-1 text-xs ${kit.muted}`}>20 / 24 px</p>
            </div>
          ))}
          <div className="rounded-xl bg-[var(--workspace-brand-background)] px-4 py-4">
            <div className="flex h-6 items-center gap-3">
              <StarFilled />
              <StarFilled size={24} className="h-6 w-6" />
            </div>
            <p className="mt-3 text-xs font-medium">Рейтинг · заливка</p>
            <p className={`mt-1 text-xs ${kit.muted}`}>20 / 24 px</p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="dark-pair"
        title="Тёмная пара"
        description="На графите те же управление, интервалы и состояния. Лаймовые действия сохраняют графитовый текст."
        states={[
          "тёмная поверхность",
          "выделенное поле",
          "focus",
          "primary",
          "secondary",
          "сохранено локально",
        ]}
        usage="Токены поверхности, текста, вторичного текста, границы и фокуса меняются вместе. Accent и on-accent согласованы между темами."
        recipe={`${darkSurface}\nPrimary: ${kit.button}\nField: ${kit.field}`}
      >
        <div className={darkSurface}>
          <p className={`text-xs font-medium ${kit.muted}`}>
            Настройки проекта
          </p>
          <h4 className="mt-3 text-3xl font-semibold leading-tight">
            Сосредоточьтесь на следующей идее.
          </h4>
          <form
            className="mt-6 grid max-w-lg gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) setSavedName(name.trim());
            }}
          >
            <label className={kit.label} htmlFor={nameId}>
              Название проекта
            </label>
            <input
              id={nameId}
              className={kit.field}
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSavedName("");
              }}
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button type="submit" disabled={!name.trim()}>
                <Icon name="check" />
                Сохранить в примере
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setName("Обжарка кофе");
                  setSavedName("");
                }}
              >
                Сбросить
              </Button>
            </div>
            <p className={`min-h-5 text-xs ${kit.muted}`} role="status">
              {savedName
                ? `Сохранено здесь: ${savedName}`
                : "Изменения остаются в этом образце."}
            </p>
          </form>
        </div>
      </Specimen>
    </div>
  );
}
