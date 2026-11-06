import { useState } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

const sections = [
  {
    id: "brief",
    number: "00",
    title: "Бриф",
    summary: "Текущая ситуация, ожидаемый результат и границы",
    details: [
      [
        "Работа над",
        "Облачная рабочая область превращает материалы проекта в пригодную бизнес-модель.",
      ],
      [
        "Ожидаемый результат",
        "После одной сосредоточенной сессии человек может начать полезный чат с контекстом проекта.",
      ],
      [
        "Известная граница",
        "Первый выпуск AI Chat создаёт письменные описания проекта и продуктов. Посадочная и платное развёртывание — дальнейшее развитие.",
      ],
    ],
  },
  {
    id: "strategy",
    number: "10",
    title: "Стратегия",
    summary: "Итоговая картина работы проекта",
    details: [
      [
        "Приоритетная аудитория",
        "Люди с идеей или ранним проектом, заметками, файлами и частичными решениями.",
      ],
      [
        "Путь клиента",
        "Добавить материалы → обсудить и править каждый файл отдельно → проверить тексты → прикрепить документы к теме проекта.",
      ],
      [
        "Success",
        "Контекст помогает принимать решения и готовить материалы без повторного объяснения.",
      ],
    ],
  },
  {
    id: "brand",
    number: "20",
    title: "Бренд",
    summary: "Смысл, обещание, подтверждение и коммуникация",
    details: [
      [
        "Meaning",
        "Опишите проект по заметкам, файлам и решениям, исправьте недостатки и используйте тексты как первый шаг к клиентам.",
      ],
      [
        "Тон общения",
        "Прямо, спокойно и конкретно; техническое объяснение нужно, только если помогает решению.",
      ],
      [
        "Основное действие",
        "Добавьте имеющиеся материалы и проверьте полученное описание.",
      ],
    ],
  },
  {
    id: "design",
    number: "30",
    title: "Дизайн",
    summary: "Айдентика, принципы интерфейса и ресурсы",
    details: [
      [
        "Интерфейс",
        "Текст об ожидаемом виде и ограничениях, проверяемый рядом с остальными документами.",
      ],
      [
        "Identity",
        "Onest для заголовков и текста, холодный серый, белый, графит и лаймовые действия.",
      ],
      [
        "Principle",
        "Показывайте прогресс через проверенные решения, без искусственных баллов и длинных форм.",
      ],
    ],
  },
  {
    id: "products",
    number: "40",
    title: "Продукты",
    summary: "Отдельные тексты продуктов со своими разделами",
    details: [
      [
        "Клиент и ценность",
        "Владельцы ранних проектов получают короткие описания, исправления, проверку, выгрузку и продолжение в чате.",
      ],
      [
        "Доступ и отношения",
        "Добавьте материалы, работайте с агентом в переписке документа и проверяйте текст. Выгружайте документы или прикрепляйте их к отдельной теме проекта.",
      ],
      [
        "Деньги и поставка",
        "AI Chat owns its token revenue and service costs. Development and support time is split equally with Code Framework; other owner work is allocated 80% to AI Chat and 20% to Code Framework. One token costs 0.13 roubles; top-ups are 100, 300, 500, 1,000 or 3,000 roubles without a package discount. Purchased tokens do not expire; cash refunds for purchases are decided case by case. Failed or cancelled AI requests restore all token deductions and have a net charge of zero; the service bears any provider expense.",
      ],
      [
        "Продвижение",
        "Письменная публичная подача каждого продукта: тексты сайта, креативов и презентации по необходимости. Раздел не собирает сайт и не производит медиа.",
      ],
      [
        "Продажи и выводы",
        "Путь клиента и текущие наблюдения связаны с продуктом и не копируются сюда.",
      ],
    ],
  },
];

const hypothesisFlow = [
  {
    number: "01",
    title: "Бриф",
    pages: "Идея + цель + предоставленные факты",
    result: "Опишите проект или передайте имеющиеся материалы",
  },
  {
    number: "02",
    title: "Черновики проекта и продуктов",
    pages: "Пять коротких этапов + отдельные продукты",
    result: "Прочитайте предложенные агентом описания",
  },
  {
    number: "03",
    title: "Каждый продукт: операции и экономика",
    pages: "Поставка + доходы + ресурсы + расходы",
    result: "Проверьте решения продукта и выделенные доли ресурсов",
  },
  {
    number: "04",
    title: "Каждый продукт: продажи",
    pages: "Путь клиента + поддержка + продолжение",
    result: "Проверьте короткое описание пути клиента продукта",
  },
  {
    number: "05",
    title: "Недочёты, найденные AI",
    pages: "Неточности + противоречия + критические предположения",
    result: "Посмотрите, каким описаниям нужны правка или ответ",
  },
  {
    number: "06",
    title: "Аналитика и исследования по необходимости",
    pages: "Наблюдения + доказательства + открытые вопросы",
    result:
      "Сохраняйте источники и ограничения; отсутствие доказательств остаётся видимым",
  },
  {
    number: "07",
    title: "Исправьте и проверьте соответствующий текст",
    pages: "Правка + ответ + проверка",
    result: "Исправьте недочёт или оставьте неизвестный факт открытым",
  },
  {
    number: "08",
    title: "Проверьте, выгрузите и откройте тему",
    pages: "Выбранные документы + отдельная тема",
    result:
      "Прикрепите проверенные документы к новой теме или свободно выгрузите их",
  },
];

export default function WorkspaceMap({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const [active, setActive] = useState(4);
  const section = sections[active];

  return (
    <div
      data-workspace-projection="singlepage"
      className={`bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)] ${embedded ? "" : "min-h-[820px] p-3 sm:p-6"}`}
    >
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]">
        {!embedded && (
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-[var(--workspace-brand-foreground)] text-[var(--workspace-brand-accent)]">
                <img
                  src="/workspace-assets/singlepage/intake/operator-logo-square-white.svg"
                  data-asset-id="singlepage-operator-logo-square-white"
                  alt=""
                  width={24}
                  height={24}
                  className="size-6"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">Пример проекта</p>
                <p className="text-sm text-[var(--workspace-brand-muted)]">
                  Модель проекта · только что сохранено
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--workspace-brand-line)] px-3 py-2 text-sm font-semibold">
                Условия запроса определены
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-medium">
                <span className="grid size-5 place-items-center rounded-full bg-[var(--workspace-brand-accent)]">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                Можно начать чат
              </span>
            </div>
          </header>
        )}

        {!embedded && (
          <section
            aria-labelledby="product-cycle-title"
            className="border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-5 py-6 sm:px-7"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                  Как проверять тексты проекта
                </p>
                <h2
                  className="mt-1 text-2xl font-semibold [font-family:var(--workspace-brand-font-display)]"
                  id="product-cycle-title"
                >
                  Черновик, правки и проверка
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[var(--workspace-brand-muted)]">
                Обсуждайте и правьте каждый файл отдельно. Проверяйте тексты,
                затем прикрепляйте документы к новой теме или свободно
                выгружайте их.
              </p>
            </div>

            <div
              aria-label="Цикл проверки текстов проекта"
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              role="list"
            >
              {hypothesisFlow.map((step, index) => (
                <div className="flex min-w-0" key={step.number} role="listitem">
                  <article
                    className={`min-h-48 flex-1 rounded-2xl border p-5 ${index === 0 ? "border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-foreground)] text-white" : index === hypothesisFlow.length - 1 ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]" : "border-[var(--workspace-brand-line)] bg-white"}`}
                  >
                    <p
                      className={`text-sm font-semibold ${index === 0 ? "text-[var(--workspace-brand-accent)]" : "text-[var(--workspace-brand-muted)]"}`}
                    >
                      {step.number}
                    </p>
                    <h3 className="mt-2 text-base font-semibold leading-5">
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm font-semibold ${index === 0 ? "text-[var(--workspace-brand-muted-on-primary)]" : "text-[var(--workspace-brand-muted)]"}`}
                    >
                      {step.pages}
                    </p>
                    <p
                      className={`mt-3 text-base leading-7 ${index === 0 ? "text-[var(--workspace-brand-background)]" : "text-[var(--workspace-brand-foreground)]"}`}
                    >
                      {step.result}
                    </p>
                  </article>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Что происходит после проверки?
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
                  <p className="text-sm font-semibold">Проверенное описание</p>
                  <p className="mt-2 text-base leading-7">
                    Сохраните проверенный текст, выгрузите его или прикрепите к
                    теме. Сохранённая версия доступна во время правок нового
                    черновика. Проверка фиксирует формулировку, а не рыночный
                    спрос.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
                  <p className="text-sm font-semibold">
                    Неизвестный факт или предположение
                  </p>
                  <p className="mt-2 text-base leading-7">
                    Оставляйте неизвестное открытым. Проверенное предположение
                    остаётся предположением. Указывайте источник доказательства
                    и правьте соответствующий текст при появлении ответа или
                    новых данных.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="border-b border-[var(--workspace-brand-line)] bg-white p-4 lg:border-r lg:border-b-0">
            <div className="rounded-2xl bg-[var(--workspace-brand-foreground)] p-4 text-white">
              <p className="text-sm font-semibold text-[var(--workspace-brand-accent)]">
                Одна страница
              </p>
              <p className="mt-2 text-xl font-semibold [font-family:var(--workspace-brand-font-display)]">
                Модель проекта
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Пять коротких разделов. Добавьте подробный документ, когда он
                понадобится.
              </p>
            </div>
            <nav aria-label="Разделы модели проекта" className="mt-4 space-y-1">
              {sections.map((item, index) => (
                <button
                  aria-current={active === index ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${kit.focus} ${active === index ? "bg-[var(--workspace-brand-foreground)] text-white [&_span]:text-white" : "hover:bg-[var(--workspace-brand-background)]"}`}
                  key={item.id}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    {item.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--workspace-brand-muted)]">
                      Принято
                    </span>
                  </span>
                </button>
              ))}
            </nav>
            <button
              className={`${kit.secondary} mt-5 w-full justify-start`}
              type="button"
            >
              <Icon name="plus" />
              Добавить подробный документ
            </button>
          </aside>

          <main className="min-w-0 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--workspace-brand-line)] pb-6">
                <div>
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    {section.number} · Принято
                  </p>
                  <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] [font-family:var(--workspace-brand-font-display)] sm:text-[56px]">
                    {section.title}
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[var(--workspace-brand-muted)]">
                    {section.summary}
                  </p>
                </div>
                <button className={kit.secondary} type="button">
                  Изменить раздел
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {section.details.map(([label, value]) => (
                  <article
                    className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5"
                    key={label}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                        {label}
                      </h2>
                      <span className="rounded-full bg-[var(--workspace-brand-background)] px-2 py-1 text-sm font-semibold">
                        Принято
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-7">{value}</p>
                    <button
                      className={`${kit.plain} mt-3 px-0 underline underline-offset-4`}
                      type="button"
                    >
                      Посмотреть источник
                    </button>
                  </article>
                ))}
              </div>

              {section.id === "products" ? (
                <section className="mt-4 rounded-2xl border border-dashed border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Экономика продукта
                      </p>
                      <p className="mt-1 text-sm text-[var(--workspace-brand-muted)]">
                        У каждого продукта свои доходы, ресурсы и расходы с
                        указанной долей общих ресурсов.
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                      У AI Chat и Code Framework свои тексты продукта, операций
                      и экономики, продаж, продвижения, аналитики и
                      исследований.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {["AI Chat", "Code Framework"].map((product) => (
                      <article
                        key={product}
                        className="rounded-xl border border-[var(--workspace-brand-line)] bg-white p-4"
                      >
                        <h3 className="text-base font-semibold">{product}</h3>
                        <ul className="mt-3 space-y-2 text-sm text-[var(--workspace-brand-muted)]">
                          {[
                            "Продукт: клиент и предложение",
                            "Операции и экономика",
                            "Продажи",
                            "Продвижение: письменная публичная подача",
                            "Аналитика и исследования по необходимости",
                          ].map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </main>

          <aside className="border-t border-[var(--workspace-brand-line)] bg-white p-5 xl:border-t-0 xl:border-l">
            <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
              Темы проекта
            </p>
            <div className="mt-4 rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-white">
              <p className="text-base font-semibold [font-family:var(--workspace-brand-font-display)]">
                Спросите обычными словами
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Выбирайте сохранённые документы для каждой темы. AI Chat
                использует вложения как контекст ответа.
              </p>
              <label className="mt-4 block" htmlFor="project-question">
                <span className="sr-only">Спросить об этом проекте</span>
                <textarea
                  className={`${kit.field} min-h-32 resize-y focus-visible:ring-[var(--workspace-brand-accent)]`}
                  defaultValue="Оцени мою идею с учётом описанных клиента и предложения"
                  id="project-question"
                />
              </label>
              <button className={`${kit.button} mt-4 w-full`} type="button">
                Спросить AI Chat
                <Icon name="arrow-right" className="size-5 shrink-0" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Полезные следующие действия
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Улучшить загруженный документ",
                  "Исправить найденные агентом недочёты",
                  "Выгрузить проверенные документы",
                  "Добавить другой продукт",
                ].map((action) => (
                  <button
                    className={`${kit.secondary} w-full justify-between text-left`}
                    key={action}
                    type="button"
                  >
                    <span>{action}</span>
                    <Icon name="arrow-right" className="size-5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
              <p className="text-sm font-semibold">
                Ошибочные и отменённые запросы
              </p>
              <p className="mt-1 text-sm leading-5 text-[var(--workspace-brand-muted)]">
                All deductions are restored, including the initial token and any
                settlement charge. The net charge is zero; the service pays any
                provider cost. Cash refunds for top-up purchases remain
                case-by-case decisions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
