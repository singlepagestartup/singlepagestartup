import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { StatusBadge } from "../interface-kit/DataDisplay";
import { useState } from "react";
import {
  Button,
  Icon,
  Surface,
  SquareImage,
} from "../interface-kit/primitives";

export default function Cards() {
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
        data-specimen="content-card"
        data-composes="surfaces"
      >
        <h3 className="text-base leading-[26px] font-semibold">Фотокарточки</h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности
        </p>
        <SurfacePatternGuidance title="Repeated item grid" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Квадратные изображения подготовлены из сгенерированных оригиналов.
          Одинаковые размеры и интервалы подписей выравнивают карточки.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
              alt="Два человека обсуждают свой бизнес."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">Деловой разговор</p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Идеи обретают форму в разговоре.
              </p>
            </figcaption>
          </Surface>
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
              alt="Владелец бизнеса остановился обдумать идею."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">
                Момент сосредоточенности
              </p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Оставьте место для внимания.
              </p>
            </figcaption>
          </Surface>
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png"
              alt="Люди выполняют небольшую бизнес-задачу."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">Работа в движении</p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Показывайте людей и их работу.
              </p>
            </figcaption>
          </Surface>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Сетка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 md:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Фотокарточка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                overflow-hidden rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Изображение</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                block aspect-square w-full object-cover
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="icon-card"
        data-composes="surfaces icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Карточки с иконками
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · иконки
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Иконка 24px сопровождает каждое конкретное утверждение. Общая рамка и
          интервалы объединяют четыре карточки.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="file-text" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Имеющиеся материалы
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Начните со своих заметок, документов и изображений.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="chat-circle" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">Контекст проекта</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Развивайте и проверяйте идеи с учётом проекта.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="stack" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">Готовая основа</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Используйте общие модули, когда понадобится ПО.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="globe" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Своя инфраструктура
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Публикуйте через свой репозиторий и сервер.
            </p>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Сетка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Карточка с иконкой</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                rounded-2xl border border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-background)] p-5
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Область иконки</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                grid h-11 w-11 place-items-center rounded-xl
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Иконка, карточка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                h-6 w-6 shrink-0
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="item-grid"
        data-composes="surfaces actions status icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Сетка повторяющихся элементов
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · действия · статус · иконки
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Создание растянуто до высоты ряда карточек проектов. Квадратные превью
          и одинаковые подписи выравнивают сетку.
        </p>
        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="secondary"
            className="h-full min-h-56 w-full flex-col gap-3 rounded-2xl border-dashed bg-[var(--workspace-brand-background)]"
            onClick={() => setNotice("Пример композиции: действие выбрано.")}
          >
            <Icon name="plus" />
            Новый проект
          </Button>
          <Surface as="article">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-framework-inheritance-cool-square.png"
              alt="Новый продукт на общей основе."
              loading="lazy"
              className="block h-auto w-full"
            />
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">Обжарка кофе</h4>
                <StatusBadge status="Draft" />
              </div>
              <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
                Бизнес-модель и заметки проекта
              </p>
            </div>
          </Surface>
          <Surface as="article">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-coordinated-agents-cool-square.png"
              alt="Человек направляет агентов к общей задаче."
              loading="lazy"
              className="block h-auto w-full"
            />
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">Творческая студия</h4>
                <StatusBadge status="In progress" />
              </div>
              <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
                Материалы и рабочие решения
              </p>
            </div>
          </Surface>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Композиция и классы раскладки
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Сетка</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Создать элемент</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                Shared Button, secondary variant; h-full min-h-56 w-full
                flex-col gap-3 rounded-2xl border-dashed
                bg-[var(--workspace-brand-background)]. The grid stretches every
                item.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Карточка проекта</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                overflow-hidden rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
          </dl>
        </details>
      </article>
    </div>
  );
}
