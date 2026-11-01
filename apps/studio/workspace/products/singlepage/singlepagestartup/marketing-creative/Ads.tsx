import "../../../../styles/singlepage.css";
import { parse } from "yaml";
import assetSource from "../../../../assets/singlepage.yaml?raw";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import { frameworkActions } from "../journey";
import { creativeAssets, creativeTypography } from "./content";

interface IAd {
  id: string;
  width: number;
  height: number;
  label: string;
  audience: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  layout: "split" | "photo" | "poster";
}
interface IPhotoAsset {
  id: string;
  path: string;
  prompt?: string;
}

const imageRoot = "/workspace-assets/singlepage/generated/framework-ads-v2";
const variants: IAd[] = [
  {
    id: "business-site",
    width: 1200,
    height: 628,
    label: "Сайт для своего продукта",
    audience:
      "Предприниматель с товаром или услугой, которому нужен свой сайт.",
    title: "Создайте сайт для своего продукта",
    body: "Каталог, заявки и оплата — готовые функции. Опишите идею в AI Chat.",
    image: `${imageRoot}/business-square.png`,
    alt: "Предприниматели обсуждают свой светильник рядом с ноутбуком.",
    layout: "split",
  },
  {
    id: "custom-workflow",
    width: 1080,
    height: 1080,
    label: "Сайт под правила бизнеса",
    audience:
      "Владелец бизнеса, которому нужны свои условия заказа, доступа или обработки заявки.",
    title: "Сайт под ваши правила",
    body: "Меняйте заказы, доступ и формы вместе с ИИ.",
    image: `${imageRoot}/workflow.png`,
    alt: "Два владельца бизнеса обсуждают изменение заказа на ноутбуке.",
    layout: "photo",
  },
  {
    id: "course-store",
    width: 1080,
    height: 1350,
    label: "Свой магазин курсов",
    audience:
      "Эксперт или преподаватель, который хочет продавать курсы на собственном сайте.",
    title: "Продавайте курсы на своём сайте",
    body: "Каталог, заказы и оплата уже есть. Соберите свой магазин с ИИ.",
    image: `${imageRoot}/courses.png`,
    alt: "Преподаватель обсуждает программу курса с коллегой.",
    layout: "poster",
  },
];
const photos = (parse(assetSource) as { assets: IPhotoAsset[] }).assets.filter(
  (asset) =>
    asset.id.startsWith("singlepage-generated-framework-ads-v2-") &&
    !asset.id.endsWith("-square"),
);

function AdIdentity({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <img
        className={`h-9 w-auto ${inverse ? "invert" : ""}`}
        src={creativeAssets.logo}
        alt="SinglePageStartup"
      />
      <span className="text-lg font-medium">Code Framework</span>
    </div>
  );
}

function AdAction({ dark = true }: { dark?: boolean }) {
  return (
    <a
      href={frameworkActions.primary.href}
      target="_top"
      className={`inline-flex shrink-0 items-center gap-6 rounded-xl px-7 py-4 text-[25px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 ${dark ? "bg-[var(--workspace-brand-foreground)] text-white" : "bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)]"}`}
    >
      {frameworkActions.primary.label}
      <span aria-hidden="true">→</span>
    </a>
  );
}

function AdArtwork({ ad }: { ad: IAd }) {
  if (ad.layout === "split") {
    return (
      <div
        className={`grid h-full grid-cols-[572px_628px] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] ${creativeTypography.body}`}
        data-ad-id={ad.id}
      >
        <div className="flex min-w-0 flex-col px-10 py-9">
          <img
            className="h-9 w-fit"
            src={creativeAssets.logo}
            alt="SinglePageStartup"
          />
          <p className="mt-6 text-lg font-medium">
            Code Framework · Сайты с ИИ
          </p>
          <h2 className="mt-4 text-[59px] font-semibold leading-[1.03] tracking-tight">
            {ad.title}
          </h2>
          <p className="mt-5 text-[25px] leading-snug">{ad.body}</p>
          <div className="mt-auto pt-5">
            <AdAction />
          </div>
          <p className="mt-4 text-base">
            Код бесплатен · ИИ и хостинг отдельно
          </p>
        </div>
        <img
          className="h-full w-full object-contain"
          src={ad.image}
          alt={ad.alt}
        />
      </div>
    );
  }
  if (ad.layout === "photo") {
    return (
      <div
        className={`flex h-full flex-col bg-[var(--workspace-brand-foreground)] text-white ${creativeTypography.body}`}
        data-ad-id={ad.id}
      >
        <div className="relative h-[720px] shrink-0">
          <img
            className="h-full w-full object-contain"
            src={ad.image}
            alt={ad.alt}
          />
          <div className="absolute top-8 right-8 left-8 rounded-xl bg-[var(--workspace-brand-foreground)] px-6 py-4">
            <AdIdentity inverse />
          </div>
        </div>
        <div className="flex flex-1 flex-col px-11 py-8">
          <h2 className="text-[64px] font-semibold leading-[1.05] tracking-tight">
            {ad.title}
          </h2>
          <p className="mt-4 text-[29px] leading-snug text-white/85">
            {ad.body}
          </p>
          <div className="mt-auto flex items-center justify-between gap-8 pt-5">
            <AdAction dark={false} />
            <p className="max-w-72 text-right text-lg leading-snug text-white/75">
              Код бесплатен
              <br />
              ИИ и хостинг отдельно
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex h-full flex-col bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] ${creativeTypography.body}`}
      data-ad-id={ad.id}
    >
      <div className="flex h-[630px] shrink-0 flex-col px-12 py-10">
        <AdIdentity />
        <h2 className="mt-9 max-w-[950px] text-[94px] font-semibold leading-[1.02] tracking-tight">
          {ad.title}
        </h2>
        <p className="mt-6 max-w-[900px] text-[34px] leading-snug">{ad.body}</p>
        <div className="mt-auto flex items-center justify-between gap-8 pt-5">
          <AdAction />
          <p className="text-right text-xl leading-snug">
            Код бесплатен
            <br />
            ИИ и хостинг отдельно
          </p>
        </div>
      </div>
      <img
        className="h-[720px] w-full object-contain"
        src={ad.image}
        alt={ad.alt}
      />
    </div>
  );
}

export default function Ads() {
  return (
    <div className="space-y-12" data-workspace-projection="singlepage">
      {variants.map((ad) => (
        <section key={ad.id} className="space-y-4">
          <div className="px-6">
            <h3 className="text-2xl font-semibold">{ad.label}</h3>
            <p className="mt-2 text-base text-[var(--workspace-brand-muted)]">
              {ad.audience}
            </p>
          </div>
          <ArtifactFrame
            width={ad.width}
            height={ad.height}
            fileName={`code-framework-${ad.id}`}
          >
            <AdArtwork ad={ad} />
          </ArtifactFrame>
        </section>
      ))}
      <details className="mx-6 rounded-2xl border border-[var(--workspace-brand-line)] p-6">
        <summary className="cursor-pointer text-lg font-semibold">
          Фотографии и промпты
        </summary>
        <p className="mt-4 text-base text-[var(--workspace-brand-muted)]">
          Три сцены созданы встроенным ImageGen для этой рекламной серии.
          Персонажи вымышленные. Текст и логотип добавлены в макетах отдельно от
          фотографии.
        </p>
        {photos.map((photo) => (
          <div
            className="mt-6 grid gap-5 md:grid-cols-[240px_1fr]"
            key={photo.id}
          >
            <img
              className="w-full rounded-xl"
              src={`/workspace-assets/${photo.path.replace(/^assets\//, "")}`}
              alt={
                photo.id.includes("business")
                  ? variants[0].alt
                  : photo.id.includes("workflow")
                    ? variants[1].alt
                    : variants[2].alt
              }
            />
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--workspace-brand-muted)]">
              {photo.prompt}
            </p>
          </div>
        ))}
      </details>
    </div>
  );
}
