import type { ReactNode } from "react";
import "../../../../styles/singlepage.css";
import { ProjectPresentation } from "../../../../utils/components/ProjectPresentation";
import { KnowledgeExample } from "../marketing-creative/KnowledgeExample";

const photos = "/workspace-assets/singlepage/generated/editorial-v1/";
const destination =
  "/?path=/story/workspace-50-materials-singlepage-ai-chat-website--website#website-landing";
const title = "text-[76px] font-semibold leading-[1.04] tracking-tight";
function Page({
  children,
  number,
  tone = "light",
}: {
  children: ReactNode;
  number: number;
  tone?: "light" | "dark" | "lime";
}) {
  return (
    <main
      data-workspace-projection="singlepage"
      className={`flex h-full flex-col overflow-hidden px-16 py-12 [font-family:var(--workspace-brand-font-body)] ${tone === "dark" ? "bg-[var(--workspace-brand-foreground)] text-white" : tone === "lime" ? "bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)]" : "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"}`}
    >
      <header className="mb-10 flex items-center justify-between text-xl font-medium">
        <span>
          SinglePageStartup <span className="ml-4 opacity-60">/ AI Chat</span>
        </span>
        <span>{String(number).padStart(2, "0")} / 09</span>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <footer className="mt-6 flex justify-between border-t border-current/15 pt-4 text-base opacity-70">
        <span>Знания бизнеса → материалы для конкретной задачи</span>
        <span>AI Chat</span>
      </footer>
    </main>
  );
}

export const presentationContent = {
  name: "AI Chat",
  slides: [
    {
      id: "knowledge",
      label: "Знания бизнеса",
      content: (
        <Page number={1} tone="dark">
          <div className="grid h-full grid-cols-2 gap-12">
            <div className="flex flex-col justify-center">
              <p className="mb-6 text-xl font-medium uppercase tracking-widest text-[var(--workspace-brand-accent)]">
                Для владельцев и маркетологов
              </p>
              <h1 className={title}>
                Ваш бизнес.
                <br />
                Ваши знания.
                <br />
                <span className="text-[var(--workspace-brand-accent)]">
                  Новый материал.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[28px] leading-[1.35] text-slate-200">
                Превращайте прайсы, заметки и опыт в статьи, рекламу и
                технические задания вместе с ИИ.
              </p>
            </div>
            <figure className="flex min-h-0 flex-col justify-center">
              <img
                src={photos + "photographer-square.png"}
                alt="Фотограф обсуждает с клиентом снимки и условия работы"
                width={1254}
                height={1254}
                className="max-h-[610px] w-auto max-w-full self-center rounded-3xl"
              />
              <figcaption className="mt-3 text-sm text-slate-300">
                Иллюстрация рабочей ситуации, созданная с ИИ.
              </figcaption>
            </figure>
          </div>
        </Page>
      ),
    },
    {
      id: "task",
      label: "Начните с одной задачи",
      content: (
        <Page number={2}>
          <p className="mb-4 text-xl font-medium uppercase tracking-widest">
            С чего начать
          </p>
          <h1 className={title}>
            Какой материал
            <br />
            нужен вашему бизнесу?
          </h1>
          <div className="mt-14 grid grid-cols-3 gap-10">
            {[
              [
                "01",
                "Статья",
                "Ответить на один вопрос клиента с примерами из вашей практики.",
              ],
              [
                "02",
                "Реклама",
                "Объяснить предложение выбранной аудитории и привести к обращению.",
              ],
              [
                "03",
                "Техническое задание",
                "Описать действия клиентов и функции будущего цифрового продукта.",
              ],
            ].map(([n, h, p]) => (
              <section
                key={n}
                className="border-t-2 border-[var(--workspace-brand-foreground)] pt-6"
              >
                <span className="text-[56px] font-semibold text-[var(--workspace-brand-muted)]">
                  {n}
                </span>
                <h2 className="mt-6 text-4xl font-semibold">{h}</h2>
                <p className="mt-5 text-[28px] leading-snug">{p}</p>
              </section>
            ))}
          </div>
          <p className="mt-12 text-2xl text-[var(--workspace-brand-muted)]">
            Для работы над статьями и рекламой собственный сайт не требуется.
          </p>
        </Page>
      ),
    },
    {
      id: "principle",
      label: "Общие условия",
      content: (
        <Page number={3} tone="lime">
          <div className="flex h-full flex-col justify-center">
            <p className="mb-10 text-2xl font-medium uppercase tracking-widest">
              Одна база знаний
            </p>
            <h1 className="max-w-6xl text-[112px] font-semibold leading-[1.02] tracking-tight">
              Меняйте формат.
              <br />
              Сохраняйте
              <br />
              условия продукта.
            </h1>
            <p className="mt-12 max-w-4xl text-[32px] leading-snug">
              Цена, состав услуги и обещания клиенту остаются основой и статьи,
              и рекламного объявления.
            </p>
          </div>
        </Page>
      ),
    },
    {
      id: "example",
      label: "Из фактов в описание",
      content: (
        <Page number={4}>
          <h1 className={title}>Из прайса — в описание услуги</h1>
          <p className="mb-9 mt-5 text-[28px]">
            Пример предметного фотографа: числа и условия сохраняются в тексте.
          </p>
          <div className="[&_figcaption]:text-xl [&_h3]:text-[40px] [&_p]:text-[22px] [&_p]:leading-snug [&_span]:text-xl">
            <KnowledgeExample compact />
          </div>
        </Page>
      ),
    },
    {
      id: "process",
      label: "Как устроена работа",
      content: (
        <Page number={5} tone="dark">
          <h1 className={title}>
            Следующий материал
            <br />
            начинается с вашего контекста
          </h1>
          <div className="mt-16 grid grid-cols-4 gap-8">
            {[
              ["Материалы", "Прайс, заметки, примеры и файлы."],
              ["Знания", "Продукт, аудитория, условия и язык бренда."],
              ["Задача", "Один читатель, один вопрос, следующий шаг."],
              [
                "Результат",
                "Текст, который можно проверить, изменить и экспортировать.",
              ],
            ].map(([h, p], i) => (
              <section key={h} className="border-t border-white/40 pt-6">
                <p className="text-[52px] text-[var(--workspace-brand-accent)]">
                  0{i + 1} {i < 3 && "→"}
                </p>
                <h2 className="mt-8 text-4xl font-semibold">{h}</h2>
                <p className="mt-5 text-[26px] leading-snug text-slate-200">
                  {p}
                </p>
              </section>
            ))}
          </div>
          <p className="mt-14 text-[28px] text-slate-300">
            В следующем разговоре ассистент снова обращается к знаниям проекта.
          </p>
        </Page>
      ),
    },
    {
      id: "use",
      label: "Работа с существующим бизнесом",
      content: (
        <Page number={6}>
          <div className="grid h-full grid-cols-[1.05fr_1fr] gap-12">
            <div className="flex flex-col justify-center">
              <h1 className={title}>
                Начните с того,
                <br />
                что уже знаете
                <br />о своём деле
              </h1>
              <p className="mt-8 text-[28px] leading-snug">
                Подойдут описание услуги, ответы клиентам, фотографии работ и
                действующий прайс.
              </p>
              <p className="mt-6 text-[28px] leading-snug">
                Вы выбираете задачу. Ассистент уточняет недостающее и помогает
                собрать результат.
              </p>
              <p className="mt-6 text-2xl text-[var(--workspace-brand-muted)]">
                Для нового цифрового продукта можно начать с идеи и технического
                задания.
              </p>
            </div>
            <img
              src={photos + "furniture-square.png"}
              alt="Реставратор и клиентка обсуждают ремонт стула"
              className="max-h-[640px] w-auto max-w-full self-center justify-self-center rounded-3xl"
              width={1254}
              height={1254}
            />
          </div>
        </Page>
      ),
    },
    {
      id: "payment",
      label: "Стоимость работы",
      content: (
        <Page number={7}>
          <div className="grid h-full grid-cols-2 items-center gap-16">
            <div>
              <p className="mb-8 text-xl font-semibold uppercase tracking-widest">
                Оплата работы ассистента
              </p>
              <h1 className="text-[150px] font-semibold leading-none tracking-tight">
                0,13 ₽
              </h1>
              <p className="mt-6 text-4xl">за внутренний токен сервиса</p>
              <p className="mt-10 max-w-xl text-[26px] leading-snug text-[var(--workspace-brand-muted)]">
                Расход зависит от объёма задачи. Фиксированной цены за статью
                нет.
              </p>
            </div>
            <div className="space-y-8 text-[28px] leading-snug">
              <div className="rounded-3xl bg-[var(--workspace-brand-accent)] p-8">
                <h2 className="font-semibold">Пополнение от 100 ₽</h2>
                <p className="mt-4">
                  Пакеты на 100, 300, 500, 1 000 и 3 000 ₽. Токены не сгорают.
                </p>
              </div>
              <p>
                Списание: один токен при старте запроса, остальное — после
                ответа.
              </p>
              <p>При ошибке или отмене запроса списание возвращается.</p>
              <p className="text-xl text-[var(--workspace-brand-muted)]">
                При отрицательном балансе 2 000 токенов или больше новые запросы
                приостанавливаются до пополнения.
              </p>
            </div>
          </div>
        </Page>
      ),
    },
    {
      id: "control",
      label: "Контроль результата",
      content: (
        <Page number={8} tone="dark">
          <h1 className={title}>
            Результат остаётся
            <br />
            доступным для вашей работы
          </h1>
          <div className="mt-14 grid grid-cols-2 gap-x-16 gap-y-10">
            {[
              [
                "Редактировать",
                "Исправляйте условия и формулировки в документах проекта.",
              ],
              [
                "Экспортировать",
                "Забирайте документы и используйте их в работе над бизнесом.",
              ],
              [
                "Продолжать",
                "Возвращайтесь к проекту за следующей статьёй или рекламным сообщением.",
              ],
              [
                "Развивать",
                "Следующий этап развития сервиса — сборка цифрового продукта и размещение через подключённые GitHub и хостинг.",
              ],
            ].map(([h, p]) => (
              <section key={h} className="border-t border-white/25 pt-5">
                <h2 className="text-3xl font-semibold text-[var(--workspace-brand-accent)]">
                  {h}
                </h2>
                <p className="mt-4 text-[26px] leading-snug text-slate-200">
                  {p}
                </p>
              </section>
            ))}
          </div>
          <p className="mt-9 text-xl text-slate-300">
            Запросы обрабатывают внешние ИИ-провайдеры. После удаления аккаунта
            резервные копии могут храниться до 6 месяцев. Поддержка отвечает в
            течение 24 часов.
          </p>
        </Page>
      ),
    },
    {
      id: "start",
      label: "Начать со своих материалов",
      content: (
        <Page number={9} tone="lime">
          <div className="flex h-full flex-col justify-center">
            <p className="text-2xl font-medium uppercase tracking-widest">
              Ваш первый результат
            </p>
            <h1 className="mt-8 max-w-6xl text-[100px] font-semibold leading-[1.02] tracking-tight">
              Возьмите одну услугу.
              <br />
              Добавьте её условия.
              <br />
              Подготовьте описание.
            </h1>
            <p className="mt-10 max-w-4xl text-[30px] leading-snug">
              Откройте AI Chat, создайте проект и передайте прайс или заметки.
              Их можно использовать и для следующего материала.
            </p>
            <a
              href={destination}
              target="_top"
              className="mt-10 inline-flex w-fit rounded-2xl bg-[var(--workspace-brand-foreground)] px-9 py-5 text-[28px] font-semibold text-white"
            >
              Начать со своих материалов ↗
            </a>
          </div>
        </Page>
      ),
    },
  ],
};
export default function AIChatPresentation() {
  return (
    <ProjectPresentation
      name={presentationContent.name}
      slides={presentationContent.slides}
    />
  );
}
