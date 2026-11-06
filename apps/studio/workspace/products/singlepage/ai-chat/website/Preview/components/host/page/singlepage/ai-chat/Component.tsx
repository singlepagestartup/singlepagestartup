import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";

import { Component as SocialModuleChat } from "../../../../social/chat/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import type { IAIChatWebsiteContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export interface IAIChatPageProps {
  content?: IAIChatWebsiteContent;
}
export function Component({ content }: IAIChatPageProps = {}) {
  return (
    <HostModuleLayout
      variant="ai-chat-landing"
      subjectAccount={<RbacModuleSubject variant="account" showTokens />}
      footerContent={content?.footer}
    >
      <main
        id="ai-chat-main"
        data-ds-page="host.page.ai-chat"
        tabIndex={-1}
        className="outline-none"
      >
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-hero"
          content={content && { hero: content.hero, labels: content.labels }}
        />
        {content && (
          <section className="mx-auto max-w-6xl px-5 py-8 @3xl:px-8">
            <h2 className="text-3xl font-semibold leading-tight">
              {content.foundation.title}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-[color:var(--workspace-brand-muted)]">
              {content.foundation.paragraphs[0]}
            </p>
            <div className="mt-6 grid gap-4 @3xl:grid-cols-3">
              {content.foundation.items.map((item) => (
                <article key={item.title} className="rounded-2xl bg-white p-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-[color:var(--workspace-brand-muted)]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        <section
          aria-labelledby="ai-chat-result-title"
          className="mx-auto max-w-6xl px-5 py-10 @3xl:px-8"
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)]">
            <header className="bg-[var(--workspace-brand-accent)] p-6 @3xl:p-8">
              <p className="text-sm font-semibold uppercase tracking-widest">
                Пример результата
              </p>
              <h2
                id="ai-chat-result-title"
                className="mt-3 text-3xl font-semibold leading-tight"
              >
                Как прайс превращается в описание услуги
              </h2>
              <p className="mt-3 max-w-3xl leading-7">
                Предметный фотограф готовит текст для заказчика. Условия
                учебные: по ним видно, что именно сохраняется в результате.
              </p>
            </header>
            <div className="grid @3xl:grid-cols-2">
              <div className="bg-[var(--workspace-brand-background)] p-6 @3xl:p-8">
                <h3 className="text-lg font-semibold">
                  Сведения из материалов
                </h3>
                <dl className="mt-5 divide-y divide-[var(--workspace-brand-line)] text-base">
                  {[
                    ["Объём", "До 10 товаров"],
                    ["Результат", "По 3 снимка каждого, JPEG"],
                    ["Обработка", "Базовая ретушь"],
                    ["Цена", "15 000 ₽ за съёмку"],
                    ["Срок", "3 рабочих дня после съёмки"],
                  ].map(([name, value]) => (
                    <div key={name} className="flex justify-between gap-6 py-3">
                      <dt className="text-[var(--workspace-brand-muted)]">
                        {name}
                      </dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-sm leading-6">
                  Клиент привозит и забирает товары. Исходные файлы не входят.
                </p>
              </div>
              <article className="bg-white p-6 @3xl:p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--workspace-brand-muted)]">
                  Текст для страницы
                </p>
                <h3 className="mt-5 text-3xl font-semibold leading-tight">
                  Фотографии товаров для вашего каталога
                </h3>
                <p className="mt-5 leading-7">
                  Снимем до 10 товаров и подготовим по 3 обработанных снимка
                  каждого за 15 000 ₽. Вы получите файлы JPEG с базовой ретушью
                  через 3 рабочих дня после съёмки.
                </p>
                <p className="mt-4 leading-7">
                  Перед съёмкой пришлите список товаров и примеры нужных
                  ракурсов. Согласуем состав съёмки и дату. Товары вы привозите
                  и забираете самостоятельно; исходники не передаются.
                </p>
                <p className="mt-6 border-t border-[var(--workspace-brand-line)] pt-5 text-sm font-medium">
                  Из этих же условий можно подготовить статью или рекламное
                  сообщение для выбранной аудитории.
                </p>
              </article>
            </div>
          </div>
        </section>
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-try"
          content={
            content && {
              workflow: content.workflow,
              uploadNote: content.labels["demo-upload-note"],
            }
          }
        >
          <SocialModuleChat
            variant="overview-preview-ai-chat"
            content={content}
          />
        </WebsiteBuilderModuleWidget>
        {content && (
          <section className="mx-auto max-w-6xl px-5 pb-10 @3xl:px-8">
            <h2 className="text-3xl font-semibold leading-tight">
              Как работает AI Chat
            </h2>
            <ol className="mt-6 grid gap-4 @3xl:grid-cols-2">
              {content.workflow.items.map((item, index) => (
                <li key={item.title} className="rounded-2xl bg-white p-6">
                  <p className="text-sm text-[color:var(--workspace-brand-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-[color:var(--workspace-brand-muted)]">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-continue"
          content={
            content && {
              continue: content.continue,
              terms: content.terms,
              startLink: content.hero.links[0],
            }
          }
        />
      </main>
    </HostModuleLayout>
  );
}
