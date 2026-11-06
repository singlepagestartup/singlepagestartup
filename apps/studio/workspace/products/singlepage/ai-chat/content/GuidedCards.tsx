import { useEffect, useId, useState } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

const stages = [
  {
    id: "brief",
    label: "Бриф",
    time: "10 мин",
    question:
      "Над чем вы работаете и каким должен быть полезный результат проекта?",
    answer:
      "Облачная рабочая область составляет короткие документы проекта и продуктов из имеющихся материалов. У каждого файла своя переписка; сохранённые тексты прикрепляются к темам проекта.",
    found: [
      "Первый продукт — облачный AI-чат.",
      "Можно передавать существующие заметки, файлы и снимки экрана.",
      "Первый результат — текстовые описания для правки, проверки и выгрузки.",
    ],
    result: "Границы, ожидаемый результат, продукты и ограничения",
  },
  {
    id: "strategy",
    label: "Стратегия",
    time: "10 мин",
    question: "Как должен работать весь проект, когда замысел реализован?",
    answer:
      "Человек добавляет материалы, обсуждает каждый файл отдельно и проверяет текст. Выбранные документы становятся контекстом новых тем. Владелец оценивает процесс перед добавлением посадочных и платного развёртывания.",
    found: [
      "Чат — основной облачный продукт.",
      "Первый выпуск создаёт письменные документы проекта и продуктов.",
      "Генерация посадочной и платное развёртывание — будущие возможности.",
      "У каждого продукта свои разделы, включая экономику, продажи, продвижение и аналитику.",
    ],
    result: "Итоговая картина, аудитории, роли продуктов и путь клиента",
  },
  {
    id: "brand",
    label: "Бренд",
    time: "8 мин",
    question: "Что человек должен понять и запомнить после использования?",
    answer:
      "Опишите проект по имеющимся заметкам, файлам и решениям. Исправьте найденные агентом недостатки и используйте проверенный текст как первый шаг к клиентам.",
    found: [
      "Существующие материалы — отправная точка описания проекта.",
      "Продукт должен быть практичным и понятным.",
      "Утверждения опираются на реальные материалы человека.",
    ],
    result: "Смысл, обещание, подтверждение, голос и основное действие",
  },
  {
    id: "design",
    label: "Дизайн",
    time: "7 мин",
    question: "Как сделать этот смысл видимым и удобным в работе?",
    answer:
      "Текстовый Дизайн: Onest, холодные нейтральные поверхности, графит, лаймовые действия и одно описание в центре внимания.",
    found: [
      "Текущая палитра: графит, холодный серый, белый и лайм.",
      "Дизайн первого выпуска — текст об ожидаемом внешнем виде.",
      "Загруженные картинки — источники, а не автоматически принятые решения дизайна.",
    ],
    result: "Визуальное направление, принципы интерфейса и доступные ресурсы",
  },
  {
    id: "products",
    label: "Продукты",
    time: "15 мин",
    question:
      "Кто получает какую ценность, как предложение поставляется и поддерживается?",
    answer:
      "Владельцы ранних проектов получают описания и продолжение в чате. У каждого продукта свои Продукт, Операции и экономика, Продажи, Продвижение, Аналитика и исследования. Выручка токенов и расходы сервиса относятся к AI Chat.",
    found: [
      "Пользователь, покупатель и принимающий решение сначала могут быть одним человеком.",
      "AI Chat и Code Framework — отдельные связанные продукты.",
      "One internal token costs 0.13 roubles. Top-ups are 100, 300, 500, 1,000 or 3,000 roubles, with no package discount.",
      "Purchased tokens do not expire; cash refunds for top-ups are decided case by case. Failed or cancelled AI requests restore all token deductions and have a net charge of zero; the service bears any provider expense. Customer demand remains unverified.",
    ],
    result:
      "Отдельные тексты продукта: паспорт, операции и экономика, продажи, продвижение, аналитика и исследования",
  },
];

interface IGuidedCardsProps {
  embedded?: boolean;
  empty?: boolean;
  onAddMaterials?: () => void;
  onDocumentsChange?: (
    documents: Record<string, string>,
    reviewed: string[],
  ) => void;
}

export default function GuidedCards({
  embedded = false,
  empty = false,
  onAddMaterials,
  onDocumentsChange,
}: IGuidedCardsProps = {}) {
  const id = useId();
  const [active, setActive] = useState(empty ? 0 : 1);
  const [accepted, setAccepted] = useState(
    () => new Set<number>(empty ? [] : [0]),
  );
  const [unknown, setUnknown] = useState(() => new Set<number>());
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      stages.map((stage) => [stage.id, empty ? "" : stage.answer]),
    ),
  );
  const stage = stages[active];
  useEffect(() => {
    onDocumentsChange?.(
      answers,
      [...accepted].map((index) => stages[index].id),
    );
  }, [answers, accepted, onDocumentsChange]);

  const advance = (state: "accepted" | "unknown") => {
    if (state === "accepted") {
      setAccepted((previous) => new Set(previous).add(active));
      setUnknown((previous) => {
        const next = new Set(previous);
        next.delete(active);
        return next;
      });
    } else {
      setUnknown((previous) => new Set(previous).add(active));
      setAccepted((previous) => {
        const next = new Set(previous);
        next.delete(active);
        return next;
      });
    }
    if (active < stages.length - 1) setActive(active + 1);
  };

  return (
    <div
      data-workspace-projection="singlepage"
      className={`@container bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)] ${embedded ? "" : "min-h-[820px] p-3 sm:p-6"}`}
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
                <p className="text-sm font-semibold">SinglePageStartup</p>
                <p className="text-sm text-[var(--workspace-brand-muted)]">
                  Настройка нового проекта
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-2 text-sm font-semibold">
                {accepted.size} из 5 проверено
              </span>
              <span className="rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-medium">
                Около часа
              </span>
            </div>
          </header>
        )}

        <div className="grid @[700px]:grid-cols-[180px_minmax(0,1fr)] @[1200px]:grid-cols-[200px_minmax(0,1fr)_280px]">
          <aside className="border-b border-[var(--workspace-brand-line)] bg-white p-4 lg:border-r lg:border-b-0">
            <p className="px-2 text-sm font-semibold text-[var(--workspace-brand-muted)]">
              Переписки документов
            </p>
            <nav
              className="mt-3 grid gap-2 @[500px]:grid-cols-2 @[700px]:grid-cols-1"
              aria-label="Этапы настройки"
            >
              {stages.map((item, index) => {
                const state = accepted.has(index)
                  ? "accepted"
                  : unknown.has(index)
                    ? "unknown"
                    : active === index
                      ? "current"
                      : "pending";
                return (
                  <button
                    aria-current={active === index ? "step" : undefined}
                    className={`flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-accent)] ${
                      active === index
                        ? "bg-[var(--workspace-brand-foreground)] text-white"
                        : "hover:bg-[var(--workspace-brand-background)]"
                    }`}
                    key={item.id}
                    onClick={() => setActive(index)}
                    type="button"
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm font-semibold ${
                        state === "accepted"
                          ? "border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)]"
                          : active === index
                            ? "border-[var(--workspace-brand-muted)]"
                            : "border-[var(--workspace-brand-line)] text-[var(--workspace-brand-muted)]"
                      }`}
                    >
                      {state === "accepted" ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold sm:text-sm">
                        {item.label}
                      </span>
                      <span
                        className={`block text-sm ${active === index ? "text-[var(--workspace-brand-muted-on-primary)]" : "text-[var(--workspace-brand-muted)]"}`}
                      >
                        {state === "unknown"
                          ? "Неизвестное сохранено"
                          : item.time}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Набор материалов
              </p>
              <p className="mt-2 text-sm font-semibold">Материалы проекта</p>
              <p className="mt-1 text-base leading-7 text-[var(--workspace-brand-muted)]">
                Заметки, файлы и изображения в чате проекта
              </p>
              <button
                className={`${kit.plain} mt-3 px-0 underline underline-offset-4`}
                onClick={onAddMaterials}
                type="button"
              >
                Добавить ещё
              </button>
            </div>
          </aside>

          <main className="min-w-0 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    Этап {active + 1} · {stage.time} предложено
                  </p>
                  <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] [font-family:var(--workspace-brand-font-display)] sm:text-5xl">
                    {stage.label}
                  </h1>
                </div>
                <span className="rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-semibold">
                  Одно решение в центре внимания
                </span>
              </div>

              <section className="mt-7 rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    Найдено в ваших материалах
                  </p>
                  <button
                    className={`${kit.plain} px-0 underline underline-offset-4`}
                    type="button"
                  >
                    Посмотреть источники
                  </button>
                </div>
                <ul className="mt-4 space-y-3">
                  {(empty ? [] : stage.found).map((item, index) => (
                    <li className="flex gap-3 text-base leading-7" key={item}>
                      <span
                        className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          index === stage.found.length - 1 &&
                          item.includes("unknown")
                            ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
                            : "bg-[var(--workspace-brand-background)]"
                        }`}
                      >
                        {index === stage.found.length - 1 &&
                        item.includes("unknown") ? (
                          <>
                            <span className="sr-only">Неизвестно</span>
                            <Icon name="question" className="size-5 shrink-0" />
                          </>
                        ) : (
                          <Icon name="check" className="h-4 w-4" />
                        )}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
                <p className="text-sm font-semibold">AI Chat</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight [font-family:var(--workspace-brand-font-display)] sm:text-3xl">
                  {stage.question}
                </h2>
                <label
                  className="mt-5 block"
                  htmlFor={`${id}-answer-${stage.id}`}
                >
                  <span className="sr-only">Ваш ответ</span>
                  <textarea
                    className={`${kit.field} min-h-40 resize-y`}
                    id={`${id}-answer-${stage.id}`}
                    onChange={(event) => {
                      setAccepted((previous) => {
                        const next = new Set(previous);
                        next.delete(active);
                        return next;
                      });
                      setAnswers((previous) => ({
                        ...previous,
                        [stage.id]: event.target.value,
                      }));
                    }}
                    value={answers[stage.id]}
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    className={kit.plain}
                    onClick={() => advance("unknown")}
                    type="button"
                  >
                    Пока не знаю
                  </button>
                  <button
                    className={kit.button}
                    disabled={!answers[stage.id].trim()}
                    onClick={() => advance("accepted")}
                    type="button"
                  >
                    {active === stages.length - 1
                      ? "Завершить проверку"
                      : "Принять и продолжить"}
                    {active < stages.length - 1 ? (
                      <Icon name="arrow-right" className="size-5 shrink-0" />
                    ) : null}
                  </button>
                </div>
              </section>

              <details className="mt-4 rounded-xl border border-[var(--workspace-brand-line)] bg-white px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold">
                  Добавляйте подробность, только если она меняет результат
                </summary>
                <p className="mt-3 leading-6 text-[var(--workspace-brand-muted)]">
                  Необязательные вопросы свёрнуты. AI Chat открывает вопрос,
                  только если ответ изменит этап или готовящийся материал.
                </p>
              </details>
              {stage.id === "products" && !empty ? (
                <section
                  className="mt-6 space-y-4"
                  aria-label="Отдельные документы продуктов"
                >
                  {["AI Chat", "Code Framework"].map((product) => (
                    <article
                      key={product}
                      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5"
                    >
                      <h2 className="text-lg font-semibold">{product}</h2>
                      <dl className="mt-3 divide-y divide-[var(--workspace-brand-line)]">
                        {[
                          [
                            "Продукт",
                            "Клиент, проблема, предложение и условия продукта.",
                          ],
                          [
                            "Операции и экономика",
                            "Поставка продукта, доходы, ресурсы, распределённые доли и расходы.",
                          ],
                          [
                            "Продажи",
                            "Путь клиента продукта, включая поддержку и продолжение.",
                          ],
                          [
                            "Продвижение",
                            "Текстовая публичная подача продукта: сайт, креативы и презентация по необходимости.",
                          ],
                          [
                            "Аналитика и исследования",
                            "Измерения, наблюдения и вопросы к доказательствам этого продукта.",
                          ],
                        ].map(([title, text]) => (
                          <div key={title} className="py-3">
                            <dt className="text-sm font-semibold">{title}</dt>
                            <dd className="mt-1 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                              {text}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </section>
              ) : null}
            </div>
          </main>

          <aside className="border-t border-[var(--workspace-brand-line)] bg-white p-5 xl:border-t-0 xl:border-l">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Тексты проекта
              </p>
              <span
                className="size-2 rounded-full bg-[var(--workspace-brand-accent)]"
                aria-label="Сохранено"
              />
            </div>
            <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted)]">
              Обновляется после проверки каждого решения.
            </p>

            <div className="mt-5 space-y-2">
              {stages.map((item, index) => (
                <button
                  className={`w-full rounded-xl border p-3 text-left ${
                    active === index
                      ? "border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-background)]"
                      : "border-[var(--workspace-brand-line)] bg-white"
                  }`}
                  key={item.id}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-sm font-semibold ${
                        accepted.has(index)
                          ? "bg-[var(--workspace-brand-background)]"
                          : unknown.has(index)
                            ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] ring-1 ring-inset ring-[var(--workspace-brand-line)]"
                            : "bg-[var(--workspace-brand-background)]"
                      }`}
                    >
                      {accepted.has(index)
                        ? "Принято"
                        : unknown.has(index)
                          ? "Неизвестно"
                          : "Черновик"}
                    </span>
                  </span>
                  <span className="mt-2 block text-base leading-7 text-[var(--workspace-brand-muted)]">
                    {item.result}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-white">
              <p className="text-sm font-semibold text-[var(--workspace-brand-accent)]">
                Полезный контекст, затем подробности
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Работайте с каждым документом в своей переписке. Проверьте
                текст, затем выгрузите его или прикрепите сохранённую версию к
                новой теме. В других файлах могут оставаться открытые вопросы.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
