import "../../../../styles/singlepage.css";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
const photos = "/workspace-assets/singlepage/generated/editorial-v1/";

export default function Ads() {
  return (
    <div className="space-y-12" data-workspace-projection="singlepage">
      <section>
        <h3 className="mb-4 px-6 text-xl font-semibold">
          Статья из опыта бизнеса · 1200 × 628
        </h3>
        <ArtifactFrame
          width={1200}
          height={628}
          fileName="ai-chat-business-content"
        >
          <div className="grid h-full grid-cols-2 bg-[var(--workspace-brand-foreground)] text-white [font-family:var(--workspace-brand-font-body)]">
            <div className="flex flex-col p-10">
              <p className="text-lg font-medium">SinglePageStartup / AI Chat</p>
              <h2 className="mt-10 text-[58px] font-semibold leading-[1.04] tracking-tight">
                Ваш опыт —<br />в следующей
                <br />
                <span className="text-[var(--workspace-brand-accent)]">
                  статье.
                </span>
              </h2>
              <p className="mt-6 text-[24px] leading-snug text-slate-200">
                Передайте условия услуги и вопросы клиентов. Подготовьте ответ
                вместе с ИИ.
              </p>
              <p className="mt-auto w-fit rounded-xl bg-[var(--workspace-brand-accent)] px-5 py-4 text-xl font-semibold text-[var(--workspace-brand-foreground)]">
                Начать со своих материалов ↗
              </p>
              <p className="mt-4 text-sm text-slate-300">
                Работа ассистента оплачивается токенами.
              </p>
            </div>
            <img
              src={photos + "photographer-square.png"}
              alt="Фотограф с клиентом выбирают снимки для каталога"
              width={1254}
              height={1254}
              className="h-full w-full object-cover"
            />
          </div>
        </ArtifactFrame>
      </section>
      <section>
        <h3 className="mb-4 px-6 text-xl font-semibold">
          Описание услуги · 1080 × 1080
        </h3>
        <ArtifactFrame
          width={1080}
          height={1080}
          fileName="ai-chat-service-description"
        >
          <div className="flex h-full flex-col bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]">
            <div className="px-12 pb-8 pt-10">
              <p className="text-xl font-medium">SinglePageStartup / AI Chat</p>
              <h2 className="mt-7 text-[72px] font-semibold leading-[1.02] tracking-tight">
                Понятное описание
                <br />
                вашей услуги.
              </h2>
              <p className="mt-6 max-w-4xl text-[28px] leading-snug">
                Из прайса и заметок — в текст, где клиент видит результат,
                условия и следующий шаг.
              </p>
            </div>
            <div className="min-h-0 flex-1 px-12">
              <img
                src={photos + "furniture.png"}
                alt="Мастер объясняет клиентке, какой ремонт нужен стулу"
                width={1536}
                height={1024}
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-6 px-12 py-9">
              <span className="rounded-xl bg-[var(--workspace-brand-foreground)] px-6 py-5 text-[25px] font-semibold text-white">
                Подготовить описание ↗
              </span>
              <p className="max-w-64 text-lg">Оплата работы ИИ токенами.</p>
            </div>
          </div>
        </ArtifactFrame>
      </section>
      <section>
        <h3 className="mb-4 px-6 text-xl font-semibold">
          Задание для интернет-магазина · 1200 × 628
        </h3>
        <ArtifactFrame
          width={1200}
          height={628}
          fileName="ai-chat-product-specification"
        >
          <div className="grid h-full grid-cols-[0.9fr_1.1fr] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]">
            <img
              src={photos + "ceramics-square.png"}
              alt="Мастерская керамики готовит товары к заказу"
              width={1254}
              height={1254}
              className="h-full w-full object-cover"
            />
            <div className="flex flex-col p-10">
              <p className="text-lg font-medium">SinglePageStartup / AI Chat</p>
              <h2 className="mt-9 text-[56px] font-semibold leading-[1.04] tracking-tight">
                Задумали
                <br />
                свой магазин?
              </h2>
              <p className="mt-6 text-[26px] leading-snug">
                Опишите товары и правила заказа. Соберите техническое задание с
                помощью ИИ.
              </p>
              <p className="mt-7 border-l-4 border-[var(--workspace-brand-accent)] pl-5 text-xl">
                Каталог → корзина → заказ
              </p>
              <p className="mt-auto w-fit rounded-xl bg-[var(--workspace-brand-foreground)] px-6 py-4 text-xl font-semibold text-white">
                Описать свою задачу ↗
              </p>
              <p className="mt-4 text-sm text-[var(--workspace-brand-muted)]">
                Работа ассистента оплачивается токенами.
              </p>
            </div>
          </div>
        </ArtifactFrame>
      </section>
    </div>
  );
}
