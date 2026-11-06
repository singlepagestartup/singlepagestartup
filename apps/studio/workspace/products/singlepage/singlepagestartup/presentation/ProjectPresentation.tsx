import { frameworkActions } from "../journey";
import type { CSSProperties } from "react";
import "../../../../styles/singlepage.css";
import {
  landingArtwork,
  productExamplePreviews,
  websiteAssets,
} from "../website/content";
import { ProjectPresentation } from "../../../../utils/components/ProjectPresentation";
import type {
  IProjectPresentationData,
  IProjectPresentationSlide,
} from "./types";

function paletteValue(
  data: IProjectPresentationData,
  role: keyof IProjectPresentationData["visual"]["palette"],
): string {
  return `var(--workspace-brand-${role}, ${data.visual.palette[role]})`;
}

function slideStyle(
  data: IProjectPresentationData,
  tone: IProjectPresentationSlide["tone"] = "light",
): CSSProperties {
  const ink = paletteValue(data, "foreground");
  const paper = paletteValue(data, "surface");
  const accent = paletteValue(data, "accent");
  return {
    "--slide-ink": tone === "dark" ? paper : ink,
    "--slide-muted": tone === "dark" ? "#C4CED3" : "#52616A",
    "--slide-line":
      tone === "dark"
        ? "#435159"
        : tone === "accent"
          ? "#92B84C"
          : paletteValue(data, "line"),
    "--slide-accent": accent,
    "--slide-dark": ink,
    "--slide-paper": paper,
    backgroundColor: tone === "dark" ? ink : tone === "accent" ? accent : paper,
    color: "var(--slide-ink)",
    fontFamily: `var(--workspace-brand-font-body, ${data.visual.bodyType})`,
  } as CSSProperties;
}

function SlideHeading({
  slide,
  large = false,
  summary = true,
}: {
  slide: IProjectPresentationSlide;
  large?: boolean;
  summary?: boolean;
}) {
  return (
    <div>
      <p className="text-base font-medium uppercase tracking-widest text-[var(--slide-muted)]">
        {slide.eyebrow}
      </p>
      <h1
        className={`mt-4 font-semibold tracking-tight ${large ? "text-[80px] leading-[1.04]" : "text-[58px] leading-[1.08]"}`}
      >
        {slide.title}
      </h1>
      {summary && slide.summary ? (
        <p className="mt-5 max-w-6xl text-2xl leading-relaxed text-[var(--slide-muted)]">
          {slide.summary}
        </p>
      ) : null}
    </div>
  );
}

function SlideBody({ slide }: { slide: IProjectPresentationSlide }) {
  switch (slide.layout) {
    case "cover":
      return (
        <div className="grid h-full grid-cols-[1.08fr_0.92fr] items-center gap-16">
          <div>
            <div className="mb-7 h-2 w-20 rounded-full bg-[var(--slide-accent)]" />
            <SlideHeading slide={slide} large />
            {slide.points.map((point) => (
              <div
                className="mt-8 border-l-2 border-[var(--slide-accent)] pl-5"
                key={point.title}
              >
                <h2 className="text-2xl font-semibold">{point.title}</h2>
                <p className="mt-2 text-xl leading-relaxed text-[var(--slide-muted)]">
                  {point.detail}
                </p>
              </div>
            ))}
          </div>
          <figure className="h-full overflow-hidden rounded-[32px]">
            <img
              className="h-full w-full object-cover"
              src={slide.image?.src}
              alt={slide.image?.alt}
            />
          </figure>
        </div>
      );
    case "gallery":
      return (
        <div>
          <SlideHeading slide={slide} />
          <div className="mt-8 grid grid-cols-4 gap-7">
            {slide.gallery?.map((item) => (
              <figure key={item.title}>
                <div className="h-[300px] overflow-hidden rounded-xl border border-[var(--slide-line)]">
                  <img
                    className="h-full w-full object-cover object-top"
                    src={item.src}
                    alt={item.alt}
                  />
                </div>
                <figcaption className="mt-5">
                  <h2 className="text-2xl font-semibold">{item.title}</h2>
                  <p className="mt-2 text-xl leading-snug text-[var(--slide-muted)]">
                    {item.detail}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      );
    case "modules":
      return (
        <div>
          <SlideHeading slide={slide} />
          <div className="mt-9 grid grid-cols-[0.6fr_1.4fr] items-center gap-20">
            <div className="border-r border-[var(--slide-line)] pr-12">
              <p className="text-[220px] font-semibold leading-none tracking-tighter text-[var(--slide-accent)]">
                15
              </p>
              <p className="mt-3 text-3xl">готовых модулей</p>
              <p className="mt-5 max-w-72 text-xl leading-relaxed text-[var(--slide-muted)]">
                Подключайте функции под задачи своего бизнеса.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-7">
              {slide.points.map((point) => (
                <article className="flex gap-4" key={point.title}>
                  <span
                    className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--slide-accent)]"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-2xl font-semibold">{point.title}</h2>
                    <p className="mt-2 text-xl leading-snug text-[var(--slide-muted)]">
                      {point.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    case "steps":
      return (
        <div>
          <SlideHeading slide={slide} />
          <ol className="relative mt-14 grid grid-cols-3 gap-12 before:pointer-events-none before:absolute before:top-14 before:right-20 before:left-14 before:h-px before:bg-[var(--slide-line)] before:content-['']">
            {slide.points.map((point, index) => (
              <li className="relative" key={point.title}>
                <div className="flex items-center justify-between pr-3">
                  <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--slide-accent)] text-5xl font-semibold text-[var(--slide-dark)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < slide.points.length - 1 ? (
                    <span
                      className="bg-[var(--slide-paper)] px-3 text-4xl"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-8 text-3xl font-semibold">{point.title}</h2>
                <p className="mt-4 text-[23px] leading-relaxed text-[var(--slide-muted)]">
                  {point.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      );
    case "divider":
      return (
        <div className="flex h-full flex-col justify-between py-8">
          <p className="text-xl uppercase tracking-widest">{slide.eyebrow}</p>
          <div className="flex items-end justify-between gap-12">
            <h1 className="max-w-[1000px] text-[120px] font-semibold leading-none tracking-tight">
              {slide.title}
            </h1>
            <span className="pb-2 text-[170px] leading-none" aria-hidden="true">
              ↗
            </span>
          </div>
          <p className="max-w-4xl text-3xl leading-relaxed">{slide.summary}</p>
        </div>
      );
    case "knowledge":
      return (
        <div>
          <SlideHeading slide={slide} />
          <div className="mt-10 grid grid-cols-[1fr_0.18fr_0.9fr_0.18fr_0.85fr] items-center gap-7">
            <div className="space-y-5">
              {slide.points.map((point) => (
                <article
                  className="rounded-2xl border border-[var(--slide-line)] p-6"
                  key={point.title}
                >
                  <h2 className="text-2xl font-semibold">{point.title}</h2>
                  <p className="mt-3 text-xl leading-relaxed text-[var(--slide-muted)]">
                    {point.detail}
                  </p>
                </article>
              ))}
            </div>
            <span
              className="text-center text-5xl text-[var(--slide-accent)]"
              aria-hidden="true"
            >
              →
            </span>
            <div className="flex aspect-square flex-col items-center justify-center rounded-full bg-[var(--slide-accent)] p-7 text-center text-[var(--slide-dark)]">
              <span className="text-6xl font-semibold">ИИ</span>
              <p className="mt-5 text-2xl leading-snug">
                с контекстом
                <br />
                вашего бизнеса
              </p>
            </div>
            <span
              className="text-center text-5xl text-[var(--slide-accent)]"
              aria-hidden="true"
            >
              →
            </span>
            <div className="space-y-5">
              {["Страница продукта", "Статья", "Презентация"].map((label) => (
                <div
                  className="rounded-xl border border-[var(--slide-line)] px-6 py-6 text-2xl"
                  key={label}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "conversation":
      return (
        <div>
          <SlideHeading slide={slide} summary={false} />
          <div className="mt-10 grid grid-cols-[0.95fr_1.05fr] gap-14">
            <div className="self-start rounded-[32px] rounded-bl-none bg-[var(--slide-dark)] p-10 text-[var(--slide-paper)]">
              <p className="text-base uppercase tracking-widest text-[var(--slide-accent)]">
                Новая задача в чате
              </p>
              <blockquote className="mt-6 text-[34px] leading-snug">
                {slide.summary}
              </blockquote>
              <p className="mt-8 inline-block rounded-lg border border-[#435159] px-4 py-2 text-xl text-[var(--slide-accent)]">
                Знания текущего проекта
              </p>
            </div>
            <ol className="space-y-7">
              {slide.points.map((point, index) => (
                <li className="flex gap-6" key={point.title}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--slide-accent)] text-2xl font-semibold">
                    {index + 1}
                  </span>
                  <div className="border-b border-[var(--slide-line)] pb-6">
                    <h2 className="text-2xl font-semibold">{point.title}</h2>
                    <p className="mt-2 text-[22px] leading-snug text-[var(--slide-muted)]">
                      {point.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      );
    case "ownership":
      return (
        <div className="grid h-full grid-cols-[0.8fr_1.2fr] items-center gap-16">
          <figure className="overflow-hidden rounded-[32px] bg-[var(--slide-paper)]">
            <img
              className="aspect-square w-full object-contain"
              src={slide.image?.src}
              alt={slide.image?.alt}
            />
          </figure>
          <div>
            <SlideHeading slide={slide} />
            <div className="mt-8 grid grid-cols-2 gap-8">
              {slide.points.map((point) => (
                <article
                  className="border-t border-[var(--slide-line)] pt-5"
                  key={point.title}
                >
                  <h2 className="text-2xl font-semibold text-[var(--slide-accent)]">
                    {point.title}
                  </h2>
                  <p className="mt-3 text-[22px] leading-snug text-[var(--slide-muted)]">
                    {point.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    case "cost":
      return (
        <div>
          <SlideHeading slide={slide} />
          <div className="mt-10 grid grid-cols-2 gap-12">
            <div className="rounded-[32px] bg-[var(--slide-accent)] p-9">
              <p className="text-[108px] font-semibold leading-none tracking-tight">
                0 ₽
              </p>
              <h2 className="mt-6 text-3xl font-semibold">
                {slide.points[0].title}
              </h2>
              <p className="mt-4 text-2xl leading-relaxed">
                {slide.points[0].detail}
              </p>
            </div>
            <div className="rounded-[32px] bg-[var(--slide-dark)] p-9 text-[var(--slide-paper)]">
              <p className="mb-7 text-base uppercase tracking-widest text-[var(--slide-accent)]">
                Отдельные расходы
              </p>
              {slide.points.slice(1).map((point) => (
                <article className="mt-6 first:mt-0" key={point.title}>
                  <h2 className="text-3xl font-semibold">{point.title}</h2>
                  <p className="mt-3 text-[22px] leading-relaxed text-[#C4CED3]">
                    {point.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    case "action":
      return (
        <div className="grid h-full grid-cols-[1.25fr_0.75fr] items-center gap-14">
          <div>
            <SlideHeading slide={slide} large />
            {slide.action ? (
              <div className="mt-9">
                <div className="flex items-center gap-8">
                  <a
                    className="inline-flex items-center gap-6 rounded-xl bg-[var(--slide-dark)] px-8 py-5 text-2xl font-semibold text-[var(--slide-paper)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    href={slide.action.href}
                    target="_top"
                  >
                    {slide.action.label}
                    <span aria-hidden="true">→</span>
                  </a>
                  <a
                    href={frameworkActions.secondary.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl underline underline-offset-4"
                  >
                    GitHub
                  </a>
                </div>
                <p className="mt-5 max-w-2xl text-xl leading-relaxed text-[var(--slide-muted)]">
                  {slide.action.detail}
                </p>
              </div>
            ) : null}
          </div>
          <figure className="rotate-3 overflow-hidden rounded-[36px] bg-[var(--slide-paper)] p-4">
            <img
              className="aspect-square w-full object-contain"
              src={slide.image?.src}
              alt={slide.image?.alt}
            />
          </figure>
        </div>
      );
  }
}

function Slide({
  data,
  slide,
  index,
}: {
  data: IProjectPresentationData;
  slide: IProjectPresentationSlide;
  index: number;
}) {
  return (
    <main
      className="flex h-full flex-col px-16 py-10"
      data-workspace-projection={data.projection}
      style={slideStyle(data, slide.tone)}
    >
      <header className="flex items-center justify-between border-b border-[var(--slide-line)] pb-5">
        <img
          className={`h-10 w-auto max-w-72 ${slide.tone === "dark" ? "invert" : ""}`}
          src={data.logo}
          alt="SinglePageStartup"
        />
        <span className="text-base text-[var(--slide-muted)]">
          {String(index + 1).padStart(2, "0")} / {data.slides.length}
        </span>
      </header>
      <div
        className="flex min-h-0 flex-1 flex-col justify-center py-8"
        data-slide-content="true"
      >
        <SlideBody slide={slide} />
      </div>
      <footer
        className="flex justify-between border-t border-[var(--slide-line)] pt-4 text-base text-[var(--slide-muted)]"
        data-slide-footer="true"
      >
        <span>{data.name}</span>
        <span>Сайты и веб-сервисы с ИИ</span>
      </footer>
    </main>
  );
}

export const presentationContent: IProjectPresentationData = {
  name: "Code Framework",
  projection: "singlepage",
  logo: websiteAssets.logo.src,
  visual: {
    palette: {
      background: "#F4F6F8",
      surface: "#FFFFFF",
      foreground: "#18232A",
      accent: "#BFEF61",
      line: "#DCE2E6",
    },
    displayType: '"Onest", sans-serif',
    bodyType: '"Onest", sans-serif',
  },
  slides: [
    {
      id: "cover",
      layout: "cover",
      tone: "dark",
      eyebrow: "Сайты и веб-сервисы с ИИ",
      title: "Создайте свой продукт уже сегодня",
      summary:
        "Опишите идею ИИ-помощнику. Выберите нужные функции, соберите страницы из готовых блоков и опубликуйте проект из чата.",
      points: [
        {
          title: "Получите ссылку для клиентов",
          detail:
            "Показывайте свой продукт, принимайте заявки и продолжайте дорабатывать его.",
        },
      ],
      image: {
        src: "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation.png",
        alt: "Обсуждение проекта за рабочим столом",
      },
    },
    {
      id: "examples",
      layout: "gallery",
      tone: "light",
      eyebrow: "Сценарии для вашего бизнеса",
      title: "Каким может быть ваш продукт",
      summary:
        "Начните с нужных функций и подключайте новые по мере развития проекта.",
      points: [],
      gallery: productExamplePreviews.map((preview, index) => ({
        src: `/workspace-assets/singlepage/generated/framework-example-previews/${preview.name}-hd.jpg`,
        alt: preview.alt,
        title: ["Сбор контактов", "Сообщество", "Магазин курсов", "Блог об ИИ"][
          index
        ],
        detail: [
          "Запись на вебинар и контакты для следующего предложения.",
          "Проекты участников, профили и обсуждения в чате.",
          "Выбор курса, заказ и доступ к учебным материалам.",
          "Статьи по темам и дополнительные материалы по подписке.",
        ][index],
      })),
    },
    {
      id: "modules",
      layout: "modules",
      tone: "dark",
      eyebrow: "Готовые возможности",
      title: "Готовые функции для ваших задач",
      summary:
        "Модули добавляют функции в проект. Команда SinglePageStartup поддерживает общий код и выпускает обновления.",
      points: [
        {
          title: "Аккаунты и доступ",
          detail: "Вход в аккаунт и доступ к личным данным.",
        },
        {
          title: "Профили и общение",
          detail: "Участники, их профили и переписка.",
        },
        {
          title: "Статьи и категории",
          detail: "Публикация материалов и поиск по темам.",
        },
        { title: "База знаний", detail: "Документы о бизнесе для ответов ИИ." },
        {
          title: "Товары и заказы",
          detail: "Каталог, корзина и оформление заказа.",
        },
        {
          title: "Платежи и валюты",
          detail: "Приём оплаты в валютах покупателей.",
        },
        {
          title: "Конструктор сайтов",
          detail: "Страницы из блоков под ваше предложение.",
        },
        { title: "Формы и заявки", detail: "Сбор обращений и работа с ними." },
      ],
    },
    {
      id: "launch",
      layout: "steps",
      tone: "light",
      eyebrow: "От идеи до ссылки для клиентов",
      title: "Три шага до запуска проекта",
      summary: "Для начала достаточно описать идею своими словами.",
      points: [
        {
          title: "Создайте аккаунт",
          detail:
            "Откройте чат. Расскажите, что предлагаете клиентам и как будет работать ваш бизнес.",
        },
        {
          title: "Спроектируйте с ИИ",
          detail:
            "Выберите функции и страницы. Добавьте тексты и изображения. Посмотрите проект и уточните, что изменить.",
        },
        {
          title: "Опубликуйте проект",
          detail:
            "Подключите GitHub: сервис создаст репозиторий проекта. Затем подключите хостинг и подтвердите развёртывание.",
        },
      ],
    },
    {
      id: "business-context",
      layout: "divider",
      tone: "accent",
      eyebrow: "После первой публикации",
      title: "Ваш бизнес в цифровом виде",
      summary:
        "Описание продукта, аудитория и оформление — основа для следующих задач.",
      points: [],
    },
    {
      id: "knowledge",
      layout: "knowledge",
      tone: "dark",
      eyebrow: "Ваш бизнес в цифровом виде",
      title: "Знания о проекте остаются с вами",
      summary:
        "ИИ сохраняет описание бизнеса, клиентов, функций и оформления. Эти документы можно дополнять и использовать в следующих задачах.",
      points: [
        {
          title: "Бриф, продукты и стратегия",
          detail:
            "Для кого вы работаете, что предлагаете и что смогут делать клиенты.",
        },
        {
          title: "Бренд и дизайн",
          detail:
            "Название, тон общения и общие правила оформления материалов.",
        },
      ],
    },
    {
      id: "reuse",
      layout: "conversation",
      tone: "light",
      eyebrow: "Развитие после запуска",
      title: "Новая задача — с контекстом вашего бизнеса",
      summary:
        "«Добавь на сайт запись на новый курс. Используй описание школы и её оформление».",
      points: [
        {
          title: "Опишите новую задачу",
          detail:
            "Откройте чат в том же проекте. Помощник автоматически ищет нужные сведения в его знаниях.",
        },
        {
          title: "Посмотрите результат",
          detail:
            "ИИ использует описание бизнеса и оформление при создании страницы курса. Уточните текст и содержание.",
        },
        {
          title: "Обновите сайт",
          detail:
            "Попросите опубликовать изменения. Новая страница появится на вашем сайте.",
        },
      ],
    },
    {
      id: "ownership",
      layout: "ownership",
      tone: "dark",
      eyebrow: "Открытый исходный код",
      title: "Развивайте продукт под свои требования",
      summary:
        "Доступ ко всему коду проекта остаётся у вас. Если готовых функций недостаточно, доработайте модуль или создайте свой.",
      points: [
        {
          title: "Через чат",
          detail: "Описывайте изменения и дополняйте знания о проекте.",
        },
        {
          title: "В своём репозитории",
          detail:
            "Откройте код в Claude Code или Codex. Передайте документы проекта и задачу ИИ-помощнику либо разработчику.",
        },
      ],
      image: {
        src: landingArtwork.modules[6].src,
        alt: "Страницы и блоки для собственного цифрового продукта",
      },
    },
    {
      id: "cost",
      layout: "cost",
      tone: "light",
      eyebrow: "Условия использования",
      title: "Код бесплатен. Сервисы оплачиваются отдельно.",
      summary: "Code Framework и документация доступны по лицензии MIT.",
      points: [
        {
          title: "Фреймворк",
          detail:
            "Открытые исходники, готовые модули и документация. Команда поддерживает общий код и исправляет ошибки.",
        },
        {
          title: "Работа с ИИ",
          detail:
            "AI Chat и инструменты разработки оплачиваются отдельно. Вы выбираете, как создавать и дорабатывать проект.",
        },
        {
          title: "Размещение",
          detail:
            "Хостинг оплачивается отдельно. Аккаунт у провайдера нужен, чтобы сайт был доступен клиентам.",
        },
      ],
    },
    {
      id: "start",
      layout: "action",
      tone: "accent",
      eyebrow: "Начните со своей идеи",
      title: "Расскажите, что хотите предложить клиентам",
      summary:
        "Вместе с ИИ-помощником выберите функции, посмотрите проект и опубликуйте его через чат.",
      points: [],
      image: {
        src: landingArtwork.hero.src,
        alt: "Сборка сайта из готовых модулей фреймворка",
      },
      action: {
        label: frameworkActions.primary.label,
        href: frameworkActions.primary.href,
        detail:
          "Начало работы — регистрация и чат с ИИ-помощником. Исходный код доступен в GitHub.",
      },
    },
  ],
};

export default function CodeFrameworkPresentation() {
  const data = presentationContent;
  return (
    <ProjectPresentation
      name={data.name}
      slides={data.slides.map((slide, index) => ({
        id: slide.id,
        label: slide.title,
        content: <Slide data={data} slide={slide} index={index} />,
      }))}
    />
  );
}
