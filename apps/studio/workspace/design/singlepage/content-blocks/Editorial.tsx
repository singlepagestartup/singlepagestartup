import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { useState } from "react";
import {
  Button,
  Icon,
  Surface,
  SquareImage,
} from "../interface-kit/primitives";

export default function Editorial() {
  const [notice, setNotice] = useState("");
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
        Композиции объединяют набор интерфейса с содержимым проекта. Действия
        ниже показывают компонент; маршруты и процессы предоставляет
        использующий проект.
      </p>
      <p role="status" className="text-sm text-[var(--workspace-brand-muted)]">
        {notice}
      </p>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="editorial-entry"
        data-composes="surfaces actions icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Вводная композиция
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · действия · иконки
        </p>
        <SurfacePatternGuidance title="Editorial entry" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Естественная фотография и графитовое утверждение делят композицию.
          Крупный пропорциональный шрифт передаёт мысль, одно лаймовое действие
          продолжает её.
        </p>
        <div className="mt-6 grid overflow-hidden rounded-2xl md:grid-cols-2">
          <div className="relative aspect-square min-w-0 md:aspect-auto">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
              alt="Два человека обсуждают свой бизнес."
              loading="lazy"
              className="absolute inset-0 h-full w-full aspect-auto object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:p-8">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
              Начните с известного
            </p>
            <h4 className="mt-4 text-3xl leading-tight font-semibold md:text-4xl">
              Ваши материалы.
              <br />
              Понятное направление.
            </h4>
            <p className="mt-5 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              Соберите заметки, документы и изображения в редактируемое описание
              проекта.
            </p>
            <div className="mt-7">
              <Button
                variant="primary"
                onClick={() =>
                  setNotice("Пример композиции: действие выбрано.")
                }
              >
                Организовать материалы
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Композиция</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid overflow-hidden rounded-2xl md:grid-cols-2
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Панель утверждения</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col justify-center bg-[var(--workspace-brand-primary)]
                p-6 text-[var(--workspace-brand-on-primary)] sm:p-8
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Рамка фотографии</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                Frame: relative aspect-square md:aspect-auto. Image: absolute
                inset-0 h-full w-full aspect-auto object-cover
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="numbered-steps"
        data-composes="surfaces structured-list"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Нумерованные шаги
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · структурированный список
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Небольшие номера задают порядок. У шага ясный заголовок и короткое
          пояснение.
        </p>
        <ol className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              01
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Принесите материалы
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Загрузите файлы или запишите известное.
            </p>
          </li>
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              02
            </span>
            <h4 className="mt-5 text-base font-semibold">Проверьте описание</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Примите полезную структуру, исправьте факт или оставьте вопрос
              открытым.
            </p>
          </li>
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              03
            </span>
            <h4 className="mt-5 text-base font-semibold">Продолжайте работу</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Обсуждайте идеи, готовьте материалы и изучайте предпросмотр
              посадочной.
            </p>
          </li>
        </ol>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Упорядоченная сетка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid list-none gap-4 p-0 md:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Шаг</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Номер шага</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                grid h-10 w-10 place-items-center rounded-xl
                bg-[var(--workspace-brand-surface)] text-sm font-semibold
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="media-and-text"
        data-composes="surfaces actions icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Иллюстрация и текст
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · действия · иконки
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Исходный фон иллюстрации белый. Соседний заголовок называет
          объясняемую связь.
        </p>
        <div className="mt-6 grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <SquareImage
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-module-hierarchy-cool-square.png"
            alt="Готовые модули соединены с общей программной основой."
            loading="lazy"
            className="block h-auto w-full rounded-2xl"
          />
          <div>
            <p className="text-sm font-medium text-[var(--workspace-brand-muted)]">
              Готовая основа
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              Общие части.
              <br />
              Свой продукт.
            </h4>
            <p className="mt-5 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Используйте общие функции и развивайте правила своего бизнеса.
              Иллюстрация объясняет идею, а не фиксирует реализацию.
            </p>
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() =>
                  setNotice("Пример композиции: действие выбрано.")
                }
              >
                Изучить фреймворк
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Композиция</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid items-center gap-6 md:grid-cols-2 md:gap-10
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Иллюстрация</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                block h-auto w-full rounded-2xl
              </dd>
            </div>
          </dl>
        </details>
      </article>
    </div>
  );
}
