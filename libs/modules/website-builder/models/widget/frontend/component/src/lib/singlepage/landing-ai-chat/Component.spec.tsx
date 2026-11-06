/** @jest-environment jsdom */
/**
 * BDD Suite: The Russian landing shows a local project workspace.
 * Given two independent landing instances without a saved Social Chat.
 * When a visitor saves an edited document, sends files and opens a discussion.
 * Then the interface matches the reviewed workspace and no AI/network call runs.
 */
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/website-builder/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: ({ id }: any) => ({
      data: { id, variant: "landing-ai-chat" },
      isLoading: false,
    }),
  },
}));
jest.mock("@sps/website-builder/models/widget/sdk/server", () => ({ api: {} }));
jest.mock("@sps/social/models/chat/frontend/component", () => {
  throw new Error("Landing must not load a Social Chat");
});
const mockFeatures = [
  {
    id: "hero",
    variant: "landing-introduction",
    title: {
      ru: "Ваши заметки, фотографии и планы — в чате проекта",
    },
    subtitle: {
      ru: "ИИ-помощник для вашей бизнес-идеи",
    },
    description: {
      ru: '{"type": "doc", "content": []}',
    },
  },
  {
    id: "workflow",
    variant: "landing-workflow",
    title: {
      ru: "Попробуйте чат",
    },
    description: {
      ru: '{"type":"doc","content":[]}',
    },
    subtitle: {
      ru: "Интерактивный пример. Изменения сохраняются только на этой странице.",
    },
  },
  {
    id: "project",
    variant: "demo-project",
    title: {
      ru: "Мастерская керамики",
    },
    subtitle: {
      ru: "Демонстрационный ответ из сохранённой записи.",
    },
  },
  {
    id: "products",
    variant: "demo-document",
    title: {
      ru: "Продукты.md",
    },
    subtitle: {
      ru: "Опишите каждый продукт, его клиентов, предложение и текущую доступность. Для каждого добавьте конкурентов и ссылки на похожие предложения. Они могут отличаться от конкурентов бизнеса в брифе.",
    },
    description: {
      ru: "## Мастер-классы по керамике\nЗанятия для начинающих по выходным.\n\n### Конкуренты этого продукта\nПока не знаю. Нужно указать похожие занятия, ссылки на предложения и причины сравнения. Этот список может отличаться от конкурентов мастерской в брифе.",
    },
  },
  {
    id: "brief",
    variant: "demo-document",
    title: {
      ru: "Бриф.md",
    },
    subtitle: {
      ru: "В брифе собраны сведения о мастерской, её клиентах и задаче сайта. Добавьте конкурентов бизнеса: названия, ссылки и почему вы сравниваете себя с ними. Если пока не знаете, так и напишите.",
    },
    description: {
      ru: "# Мастерская керамики\n\nПроводим мастер-классы по выходным для взрослых, которые впервые пробуют керамику. На каждом занятии — шесть мест.\n\nНа сайте посетитель знакомится с мастерской, выбирает занятие и оставляет заявку.\n\n## Конкуренты\nПока не знаю. Нужно указать мастерские, которые считаем конкурентами, ссылки на них и причины сравнения. Если есть примеры их рекламы или публикаций, добавим их сюда.",
    },
  },
  {
    id: "strategy",
    variant: "demo-document",
    title: {
      ru: "Стратегия.md",
    },
    subtitle: {
      ru: "В стратегии описаны аудитория, предложение и путь к записи на занятие. Обсудите, какие сведения нужны клиенту перед выбором даты.",
    },
    description: {
      ru: "## Аудитория\nВзрослые, которые хотят впервые попробовать керамику.\n\n## Предложение\nМастер-класс выходного дня в группе до шести человек.\n\n## Как знакомим с мастерской\nПоказываем процесс занятия и работы участников. Ведём посетителя от знакомства с форматом к выбору даты и заявке.",
    },
  },
  {
    id: "brand",
    variant: "demo-document",
    title: {
      ru: "Бренд.md",
    },
    subtitle: {
      ru: "В документе о бренде зафиксированы название и правила общения с клиентами. Предложите текст приглашения на первое занятие.",
    },
    description: {
      ru: "## Название\nМастерская керамики.\n\n## Как рассказываем о занятиях\nПоказываем материалы, процесс и работы участников. Объясняем, что человек сделает на первом занятии.\n\n## Что сообщаем перед записью\nДату, длительность, стоимость, число мест и то, что входит в мастер-класс.",
    },
  },
  {
    id: "design",
    variant: "demo-document",
    title: {
      ru: "Дизайн.md",
    },
    subtitle: {
      ru: "В дизайне описаны страницы, блоки и форма записи. Обсудите, что посетитель должен увидеть на главной странице мастерской.",
    },
    description: {
      ru: "## Страницы\nГлавная, расписание мастер-классов и запись на занятие.\n\n## Блоки главной страницы\nФотографии мастерской, программа первого занятия, работы участников и ближайшие даты.\n\n## Форма записи\nИмя, контакт для связи и выбранная дата. До отправки заявки посетитель видит, сколько мест в группе.",
    },
  },
  {
    id: "terms",
    variant: "landing-disclosure",
    title: {
      ru: "Доступ, токены и ваши материалы",
    },
    description: {
      ru: '{"type":"doc","content":[]}',
    },
  },
];
jest.mock(
  "@sps/website-builder/relations/widgets-to-features/frontend/component",
  () => ({
    Component: (props: any) =>
      props.variant === "find"
        ? props.children({
            data: mockFeatures.map((feature, index) => ({
              id: "link-" + index,
              widgetId: props.apiProps.params.filters.and[0].value,
              featureId: feature.id,
              orderIndex: index,
              variant: "default",
            })),
          })
        : jest
            .requireMock(
              "@sps/website-builder/models/feature/frontend/component",
            )
            .Component({
              isServer: props.isServer,
              variant: mockFeatures.find(
                (feature) => feature.id === props.data.featureId,
              )!.variant,
              dataSource: "props",
              data: mockFeatures.find(
                (feature) => feature.id === props.data.featureId,
              ),
              language: props.language,
              children: props.children,
            }),
  }),
);
jest.mock("@sps/website-builder/models/feature/frontend/component", () => {
  const actual = jest.requireActual(
    "@sps/website-builder/models/feature/frontend/component",
  );
  return {
    ...actual,
    Component: (props: any) =>
      props.variant === "find" ? (
        props.children({ data: mockFeatures })
      ) : (
        <actual.Component {...props} />
      ),
  };
});
jest.mock(
  "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: any) =>
      props.variant === "find" ? props.children({ data: [] }) : null,
  }),
);
jest.mock(
  "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component",
  () => ({
    Component: (props: any) =>
      props.variant === "find" ? (
        props.children({
          data:
            props.apiProps.params.filters.and[0].value === "hero"
              ? [{ id: "start", featureId: "hero" }]
              : props.apiProps.params.filters.and[0].value === "terms"
                ? [{ id: "terms", featureId: "terms" }]
                : [],
        })
      ) : props.data.id === "start" ? (
        <a href="/ru/ai-chat/create-account">Начать со своих материалов</a>
      ) : (
        <>
          <a href="/ru/ecommerce">Купить токены</a>
          <a href="/ru/ai-chat/help">Помощь</a>
          <a href="/ru#how-your-materials-are-processed-and-stored">
            Обработка и хранение материалов
          </a>
        </>
      ),
  }),
);
import { Component as Widget } from "@sps/website-builder/models/widget/frontend/component";

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => "blob:http://localhost/local-preview");
  URL.revokeObjectURL = jest.fn();
  window.requestAnimationFrame = (callback) => {
    callback(0);
    return 1;
  };
  HTMLElement.prototype.scrollTo = jest.fn();
});

it("uses the Russian workspace, isolates each visitor and retains edited knowledge in a new discussion without network", () => {
  const previous = globalThis.fetch;
  const network = jest.fn(() => {
    throw new Error("Demonstration network is forbidden");
  });
  globalThis.fetch = network as any;
  try {
    const { container } = render(
      <>
        <Widget
          isServer={false}
          variant="landing-ai-chat"
          language="ru"
          data={{ id: "landing-a" } as any}
        />
        <Widget
          isServer={false}
          variant="landing-ai-chat"
          language="ru"
          data={{ id: "landing-b" } as any}
        />
      </>,
    );
    const demos = container.querySelectorAll(
      '[data-variant="landing-ai-chat-demo"]',
    );
    const first = within(demos[0] as HTMLElement),
      second = within(demos[1] as HTMLElement);
    expect(demos).toHaveLength(2);
    expect(
      first.getByRole("heading", { name: "Мастерская керамики" }),
    ).toBeTruthy();
    expect(first.queryByRole("button", { name: "Check materials" })).toBeNull();
    fireEvent.click(
      first.getByRole("button", { name: "Редактор", exact: true }),
    );
    fireEvent.change(first.getByRole("textbox", { name: "Текст документа" }), {
      target: { value: "Мастер-классы для начинающих: шесть мест." },
    });
    fireEvent.click(
      first.getByRole("button", { name: "Сохранить знания", exact: true }),
    );
    expect(first.getByRole("status").textContent).toContain("Знания сохранены");
    fireEvent.click(
      first.getByRole("button", { name: "Предпросмотр", exact: true }),
    );
    expect(
      first.getByText("Мастер-классы для начинающих: шесть мест."),
    ).toBeTruthy();
    expect(
      second.queryByText("Мастер-классы для начинающих: шесть мест."),
    ).toBeNull();
    fireEvent.change(
      first.getByRole("textbox", { name: "Сообщение", exact: true }),
      { target: { value: "Как рассказать о мастер-классе?" } },
    );
    fireEvent.click(
      first.getByRole("button", { name: "Отправить", exact: true }),
    );
    expect(first.getByRole("log").textContent).toContain(
      "Как рассказать о мастер-классе?",
    );
    expect(first.getByRole("log").textContent).not.toMatch(/\bYou\b|Вы ·/);
    expect(second.getByRole("log").textContent).not.toContain(
      "Как рассказать о мастер-классе?",
    );
    fireEvent.click(
      first.getByRole("button", { name: "Новое обсуждение", exact: true }),
    );
    fireEvent.change(first.getByLabelText("Название обсуждения"), {
      target: { value: "Приглашение на занятие" },
    });
    fireEvent.click(first.getByRole("button", { name: "Создать обсуждение" }));
    expect(
      first.getByRole("heading", { name: "Приглашение на занятие" }),
    ).toBeTruthy();
    expect(first.getByRole("log").textContent).toContain(
      "Мастер-классы для начинающих: шесть мест.",
    );
    expect(network).not.toHaveBeenCalled();
    expect(
      screen
        .getAllByRole("link", { name: "Начать со своих материалов" })[0]
        .getAttribute("href"),
    ).toBe("/ru/ai-chat/create-account");
    fireEvent.click(screen.getAllByText("Доступ, токены и ваши материалы")[0]);
    for (const [label, href] of [
      ["Купить токены", "/ru/ecommerce"],
      ["Помощь", "/ru/ai-chat/help"],
      [
        "Обработка и хранение материалов",
        "/ru#how-your-materials-are-processed-and-stored",
      ],
    ]) {
      expect(
        screen.getAllByRole("link", { name: label })[0].getAttribute("href"),
      ).toBe(href);
    }
  } finally {
    globalThis.fetch = previous;
  }
});

/**
 * BDD Scenario: Local files remain previewable after sending a message.
 * Given a selected text file in the draft.
 * When the visitor sends the file and opens its card.
 * Then the stored local bytes appear in the Russian preview dialog.
 */
it("previews local files from sent messages without uploading them", async () => {
  const { container } = render(
    <Widget
      isServer={false}
      variant="landing-ai-chat"
      language="ru"
      data={{ id: "landing" } as any}
    />,
  );
  const file = new File(["Шесть мест на занятии"], "план.txt", {
    type: "text/plain",
  });
  fireEvent.change(screen.getByLabelText("Файлы сообщения"), {
    target: { files: [file] },
  });
  expect(screen.getByRole("list", { name: "Вложения сообщения" })).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Отправить", exact: true }),
  );
  expect(screen.queryByRole("list", { name: "Вложения сообщения" })).toBeNull();
  fireEvent.click(
    within(screen.getByRole("log")).getByRole("button", {
      name: "Открыть план.txt",
    }),
  );
  const dialog = await screen.findByRole("dialog");
  await waitFor(() =>
    expect(within(dialog).getByText("Шесть мест на занятии")).toBeTruthy(),
  );
  expect(
    within(dialog).getByRole("button", { name: "Скачать", exact: true }),
  ).toBeTruthy();
  expect(
    container.querySelector('[data-variant="landing-ai-chat-demo"]'),
  ).toBeTruthy();
});

/** BDD: a narrow workspace switches between the document and chat without losing its draft. */
it("switches document/chat panes and returns to the composer when discussing a section", () => {
  render(
    <Widget
      isServer={false}
      variant="landing-ai-chat"
      language="ru"
      data={{ id: "pane-demo" } as any}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Документ", exact: true }),
  );
  expect(
    screen
      .getByRole("button", { name: "Документ", exact: true })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.change(screen.getByRole("textbox", { name: "Текст документа" }), {
    target: { value: "Новый текст мастер-класса" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Сохранить знания", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Обсудить раздел", exact: true }),
  );
  expect(
    screen
      .getByRole("button", { name: "Чат", exact: true })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(
    screen.getByRole("button", { name: "Документ", exact: true }),
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: "Текст документа",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("Новый текст мастер-класса");
});

/** BDD: all production document sections have independent local drafts and conversations. */
it("opens all five documents and keeps their text, saved knowledge and messages separate", () => {
  render(
    <Widget
      isServer={false}
      variant="landing-ai-chat"
      language="ru"
      data={{ id: "all-documents" } as any}
    />,
  );
  const names = [
    "Бриф.md",
    "Стратегия.md",
    "Бренд.md",
    "Дизайн.md",
    "Продукты.md",
  ];
  for (const name of names)
    expect(screen.getByRole("button", { name, exact: true })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Скрыть список документов" })
      .textContent,
  ).toContain("5");
  fireEvent.click(screen.getByRole("button", { name: "Бриф.md", exact: true }));
  const text = "Бриф мастерской: шесть участников на занятии.";
  fireEvent.change(screen.getByRole("textbox", { name: "Текст документа" }), {
    target: { value: text },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Сохранить знания", exact: true }),
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Сообщение", exact: true }),
    { target: { value: "Вопрос об аудитории брифа" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Отправить", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Стратегия.md", exact: true }),
  );
  expect(screen.getByRole("log").textContent).not.toContain(
    "Вопрос об аудитории брифа",
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Текст документа" }), {
    target: { value: "Черновик стратегии" },
  });
  for (const name of ["Бренд.md", "Дизайн.md", "Продукты.md"]) {
    fireEvent.click(screen.getByRole("button", { name, exact: true }));
    expect(
      screen
        .getByRole("button", { name, exact: true })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Текст документа",
        }) as HTMLTextAreaElement
      ).value,
    ).not.toBe(text);
  }
  fireEvent.click(screen.getByRole("button", { name: "Бриф.md", exact: true }));
  expect(
    (
      screen.getByRole("textbox", {
        name: "Текст документа",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe(text);
  expect(screen.getByRole("log").textContent).toContain(
    "Вопрос об аудитории брифа",
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Сохранить знания",
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Стратегия.md", exact: true }),
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: "Текст документа",
      }) as HTMLTextAreaElement
    ).value,
  ).toBe("Черновик стратегии");
  expect(
    (
      screen.getByRole("button", {
        name: "Сохранить знания",
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

/** Persisted document IDs and labels are content, not a fixed business catalog. */
it("renders edited saved project and document titles without a code-side catalog", () => {
  const project = mockFeatures.find((feature) => feature.id === "project")!;
  const brief = mockFeatures.find((feature) => feature.id === "brief")!;
  const previousProject = project.title.ru,
    previousTitle = brief.title.ru;
  try {
    project.title.ru = "Новая школа";
    brief.title.ru = "Исследование клиентов.md";
    render(
      <Widget
        isServer={false}
        variant="landing-ai-chat"
        language="ru"
        data={{ id: "editable-copy" } as any}
      />,
    );
    expect(screen.getByRole("heading", { name: "Новая школа" })).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Исследование клиентов.md",
        exact: true,
      }),
    ).toBeTruthy();
  } finally {
    project.title.ru = previousProject;
    brief.title.ru = previousTitle;
  }
});

it("switches saved content and workspace controls together, with Russian as the default", () => {
  const project = mockFeatures.find((feature) => feature.id === "project")!;
  const products = mockFeatures.find((feature) => feature.id === "products")!;
  const previousProject = { ...project.title };
  const previousTitle = { ...products.title };
  const previousIntro = { ...products.subtitle };
  try {
    Object.assign(project.title, { en: "Pottery studio" });
    Object.assign(products.title, { en: "Products.md" });
    Object.assign(products.subtitle, { en: "Describe your workshops." });
    const view = render(
      <Widget
        isServer={false}
        variant="landing-ai-chat"
        language="en"
        data={{ id: "localized-demo" } as any}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Pottery studio" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Products.md", exact: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Send", exact: true }),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Document text" })).toBeTruthy();
    expect(screen.getByText("Describe your workshops.")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Отправить", exact: true }),
    ).toBeNull();
    view.rerender(
      <Widget
        isServer={false}
        variant="landing-ai-chat"
        data={{ id: "localized-demo" } as any}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Мастерская керамики" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Отправить", exact: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Текст документа" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Send", exact: true }),
    ).toBeNull();
  } finally {
    project.title = previousProject;
    products.title = previousTitle;
    products.subtitle = previousIntro;
  }
});
