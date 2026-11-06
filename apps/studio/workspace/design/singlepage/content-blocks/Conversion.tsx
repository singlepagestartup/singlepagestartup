import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { ConfirmationDialog } from "../interface-kit/Confirmation";
import { StatusBadge } from "../interface-kit/DataDisplay";
import { useState } from "react";
import { Button, Icon, kit, Surface } from "../interface-kit/primitives";

export default function Conversion() {
  const [notice, setNotice] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить этот проект?"
        description="Локальный пример показывает запрос удаления. Сохранённый проект не удаляется."
        confirmLabel="Удалить проект"
        onConfirm={() => setNotice("В примере запрошено удаление проекта.")}
      />
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
        data-specimen="offer-comparison"
        data-composes="surfaces actions"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Сравнение предложений
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · действия
        </p>
        <SurfacePatternGuidance title="Offer comparison" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Два продукта имеют равные столбцы и общую иерархию. Графитовая панель
          выделяет один путь, не выдумывая цену или платный тариф.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)]">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
              Облачная рабочая область
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              AI Chat
            </h4>
            <p className="mt-4 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              Превратите материалы в описание проекта. Продолжайте обсуждать и
              развивать его с контекстом.
            </p>
            <p className="mt-6 text-lg font-semibold">Токены по расходу</p>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              При регистрации доступен бесплатный запас. Пополняйте, когда нужно
              больше.
            </p>
            <div className="mt-7">
              <Button
                variant="primary"
                onClick={() =>
                  setNotice("Пример композиции: действие выбрано.")
                }
              >
                Изучить AI Chat
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted)]">
              Исходный код
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              Code Framework
            </h4>
            <p className="mt-4 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Создайте сайт или продукт на общей кодовой основе, в своём
              репозитории и инфраструктуре.
            </p>
            <p className="mt-6 text-lg font-semibold">Бесплатно по MIT</p>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Хостинг, подписки на агентов и использование облачного AI Chat
              оплачиваются отдельно.
            </p>
            <div className="mt-7">
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
              <dt className="font-semibold">Сетка сравнения</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 md:grid-cols-2
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Выделенный путь</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col rounded-2xl bg-[var(--workspace-brand-primary)]
                p-6 text-[var(--workspace-brand-on-primary)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Обычный путь</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-background)] p-6
              </dd>
            </div>
          </dl>
        </details>
      </article>

      <article
        data-specimen="contextual-sheet"
        data-composes="surfaces actions icons status fields"
        className={kit.card}
      >
        <h3 className="text-base font-semibold">Контекстная панель</h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Состав: поверхности · действия · иконки · статус · поля
        </p>
        <SurfacePatternGuidance title="Contextual sheet" />
        <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
          Компактная поверхность объединяет запись, состояние и нужные действия.
          Для открытия поверх страницы используйте Sheet.
        </p>
        <div className="mt-6 rounded-2xl bg-[var(--workspace-brand-background)] p-4 sm:p-6">
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Обжарка кофе</h4>
              <StatusBadge status="Draft" />
            </div>
            <dl className="mt-5 text-sm">
              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
                <dt className={kit.muted}>Вид</dt>
                <dd>Модель проекта</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
                <dt className={kit.muted}>Видимость</dt>
                <dd>Частный просмотр</dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() => setNotice("Пример композиции: выбрана правка.")}
              >
                <Icon name="pencil-simple" />
                Изменить
              </Button>
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() => setNotice("Пример композиции: выбран просмотр.")}
              >
                <Icon name="eye" />
                Просмотр
              </Button>
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() =>
                  setNotice("Пример композиции: выбрана публикация.")
                }
              >
                <Icon name="upload-simple" />
                Опубликовать
              </Button>
            </div>
            <div className="mt-5 border-t border-[var(--workspace-brand-line)] pt-5">
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setDeleteOpen(true)}
              >
                <Icon name="trash" />
                Удалить проект
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4 text-xs leading-5">
          <summary
            className={`w-fit cursor-pointer rounded-md font-medium ${kit.focus}`}
          >
            Композиция и классы раскладки
          </summary>
          <p className={`mt-4 ${kit.muted}`}>
            Container: w-full max-w-sm rounded-2xl border p-5 sm:p-6. Actions:
            shared Button secondary and danger variants; grid gap-2
            sm:grid-cols-3. Destructive actions open Confirmation dialog in the
            consuming product. Keep one action per button and allow labels to
            wrap.
          </p>
        </details>
      </article>
    </div>
  );
}
