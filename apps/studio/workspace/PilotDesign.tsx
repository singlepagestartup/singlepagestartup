export interface IPilotDesignData {
  name: string;
  primary: string;
  accent: string;
  paper: string;
  ink: string;
  muted: string;
  line: string;
  displayType: string;
  bodyType: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  successTitle: string;
  successCopy: string;
  assetRoot: string;
}

export type PilotDesignView =
  | "brand"
  | "tokens"
  | "imagery"
  | "components"
  | "landing"
  | "mobile"
  | "form"
  | "success"
  | "acquisition";

function Mark({
  data,
  inverted = false,
}: {
  data: IPilotDesignData;
  inverted?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <span
        className="grid h-10 w-10 grid-cols-2 border-2 p-1"
        style={{ borderColor: inverted ? data.paper : data.primary }}
        aria-hidden="true"
      >
        <span
          className="border-b border-r"
          style={{ borderColor: data.accent }}
        />
        <span className="border-b" style={{ borderColor: data.accent }} />
        <span className="border-r" style={{ borderColor: data.accent }} />
      </span>
      <span
        className="text-3xl"
        style={{
          color: inverted ? data.paper : data.primary,
          fontFamily: data.displayType,
        }}
      >
        {data.name}
      </span>
    </div>
  );
}

function EvidenceChip({
  children,
  tone = "fact",
}: {
  children: string;
  tone?: "fact" | "promise" | "missing";
}) {
  const styles =
    tone === "fact"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "promise"
        ? "bg-amber-100 text-amber-950"
        : "bg-rose-100 text-rose-900";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  data,
  children,
}: {
  data: IPilotDesignData;
  children: string;
}) {
  return (
    <button
      type="button"
      className="min-h-11 rounded-xl px-5 py-3 text-sm font-bold shadow-sm outline-offset-4"
      style={{ backgroundColor: data.accent, color: data.ink }}
    >
      {children}
    </button>
  );
}

function Process({
  data,
  compact = false,
}: {
  data: IPilotDesignData;
  compact?: boolean;
}) {
  const steps = [
    ["01", "Вы отправляете фото", "Общий вид, повреждение и створка."],
    ["02", "Алексей уточняет", "Район, симптомы, доступ и результат."],
    [
      "03",
      "Договариваемся об осмотре",
      "Только если по фото есть смысл продолжать.",
    ],
    ["04", "Получаете объём", "Работы, материалы, исключения, срок и цена."],
  ];
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-4"}`}>
      {steps.map(([number, title, copy]) => (
        <div
          key={number}
          className="rounded-2xl border p-4"
          style={{ borderColor: data.line }}
        >
          <span className="text-xs font-bold" style={{ color: data.accent }}>
            {number}
          </span>
          <h3 className="mt-8 font-semibold" style={{ color: data.ink }}>
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6" style={{ color: data.muted }}>
            {copy}
          </p>
        </div>
      ))}
    </div>
  );
}

function RequestForm({
  data,
  compact = false,
}: {
  data: IPilotDesignData;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8"
      style={{ backgroundColor: data.primary, color: data.paper }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: data.accent }}
      >
        Фото-заявка
      </p>
      <h2
        className={`mt-3 ${compact ? "text-2xl" : "text-3xl"}`}
        style={{ fontFamily: data.displayType }}
      >
        Покажите, что происходит с окном
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 opacity-75">
        Поля отражают будущий контракт заявки. Эта Studio-композиция ничего не
        отправляет.
      </p>
      <div className={`mt-6 grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
        {[
          "Как к вам обращаться?",
          "Телефон для ответа",
          "Район Москвы",
          "Что происходит?",
        ].map((label) => (
          <label
            key={label}
            className={
              label === "Что происходит?" && !compact ? "md:col-span-2" : ""
            }
          >
            <span className="mb-2 block text-xs font-semibold">{label}</span>
            {label === "Что происходит?" ? (
              <textarea
                readOnly
                className="min-h-24 w-full rounded-xl border border-white/20 bg-white/10 p-3 text-white outline-offset-4"
              />
            ) : (
              <input
                readOnly
                className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white outline-offset-4"
              />
            )}
          </label>
        ))}
        <div className={compact ? "" : "md:col-span-2"}>
          <div className="rounded-xl border border-dashed border-white/40 p-5 text-center text-sm">
            Добавить 1–6 фото · будущий лимит
          </div>
          <p className="mt-3 text-xs leading-5 opacity-70">
            Публикация фотографий потребует отдельного согласия. Юридическая
            формулировка ещё не утверждена.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="mt-5 min-h-11 rounded-xl px-5 py-3 text-sm font-bold"
        style={{ backgroundColor: data.accent, color: data.ink }}
      >
        Отправить заявку
      </button>
    </div>
  );
}

function Landing({
  data,
  mobile = false,
}: {
  data: IPilotDesignData;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "mx-auto w-[390px] overflow-hidden rounded-[38px] border-[10px] border-slate-900 shadow-2xl"
          : "w-full overflow-hidden rounded-3xl shadow-2xl"
      }
      style={{
        backgroundColor: data.paper,
        color: data.ink,
        fontFamily: data.bodyType,
      }}
    >
      <header
        className="flex items-center justify-between border-b px-5 py-4 md:px-10"
        style={{ borderColor: data.line }}
      >
        <Mark data={data} />
        {!mobile && (
          <span className="text-sm" style={{ color: data.muted }}>
            Москва · вымышленный pilot
          </span>
        )}
      </header>
      <section
        className={`grid gap-8 px-5 py-12 md:px-10 md:py-20 ${mobile ? "" : "lg:grid-cols-[1.25fr_.75fr]"}`}
      >
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: data.accent }}
          >
            {data.eyebrow}
          </p>
          <h1
            className={`mt-5 max-w-4xl leading-[1.02] ${mobile ? "text-[42px]" : "text-5xl md:text-7xl"}`}
            style={{ color: data.primary, fontFamily: data.displayType }}
          >
            {data.headline}
          </h1>
          <p
            className="mt-6 max-w-2xl text-base leading-7 md:text-lg"
            style={{ color: data.muted }}
          >
            {data.subheadline}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryButton data={data}>{data.primaryCta}</PrimaryButton>
            <button
              type="button"
              className="min-h-11 rounded-xl border px-5 py-3 text-sm font-semibold"
              style={{ borderColor: data.primary, color: data.primary }}
            >
              {data.secondaryCta}
            </button>
          </div>
          <p
            className="mt-5 max-w-2xl text-xs leading-5"
            style={{ color: data.muted }}
          >
            По фото нельзя назвать окончательную цену или гарантировать
            восстановление — состояние проверяется на месте.
          </p>
        </div>
        <div
          className="min-h-72 overflow-hidden rounded-2xl border"
          style={{ borderColor: data.line }}
        >
          <img
            src={`${data.assetRoot}/frame-pattern.svg`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </section>
      <section className="px-5 py-12 md:px-10">
        <p
          className="mb-4 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: data.accent }}
        >
          Как это работает
        </p>
        <Process data={data} compact={mobile} />
      </section>
      <section
        className="mx-5 mb-12 grid gap-6 rounded-3xl p-6 md:mx-10 md:grid-cols-2 md:p-10"
        style={{ backgroundColor: "#E8ECE7" }}
      >
        <div>
          <EvidenceChip tone="missing">
            портфолио пока не подтверждено
          </EvidenceChip>
          <h2
            className="mt-5 text-3xl"
            style={{ fontFamily: data.displayType }}
          >
            За ответ и работу отвечает один человек
          </h2>
        </div>
        <p className="leading-7" style={{ color: data.muted }}>
          До появления разрешённых фотографий доверие строится на прозрачном
          процессе и явных ограничениях — без выдуманной команды и чужих работ.
        </p>
      </section>
      <section className="px-5 pb-12 md:px-10">
        <RequestForm data={data} compact={mobile} />
      </section>
    </div>
  );
}

export function PilotDesign({
  data,
  view,
}: {
  data: IPilotDesignData;
  view: PilotDesignView;
}) {
  const pageStyle = {
    backgroundColor: data.paper,
    color: data.ink,
    fontFamily: data.bodyType,
  };

  if (view === "landing")
    return (
      <div className="min-h-screen bg-slate-200 p-4 md:p-10">
        <Landing data={data} />
      </div>
    );
  if (view === "mobile")
    return (
      <div className="min-h-screen overflow-auto bg-slate-200 p-5">
        <Landing data={data} mobile />
      </div>
    );
  if (view === "form")
    return (
      <div className="min-h-screen p-5 md:p-16" style={pageStyle}>
        <div className="mx-auto max-w-4xl">
          <RequestForm data={data} />
        </div>
      </div>
    );
  if (view === "success")
    return (
      <div
        className="grid min-h-screen place-items-center p-5"
        style={pageStyle}
      >
        <div
          className="max-w-xl rounded-3xl border bg-white p-8 shadow-xl"
          style={{ borderColor: data.line }}
        >
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-2xl font-bold"
            style={{ backgroundColor: "#DDE9E2", color: data.primary }}
          >
            ✓
          </div>
          <EvidenceChip tone="promise">
            P-01 · confirmation required
          </EvidenceChip>
          <h1
            className="mt-5 text-4xl"
            style={{ color: data.primary, fontFamily: data.displayType }}
          >
            {data.successTitle}
          </h1>
          <p className="mt-4 leading-7" style={{ color: data.muted }}>
            {data.successCopy}
          </p>
          <button
            type="button"
            className="mt-6 text-sm font-semibold underline underline-offset-4"
            style={{ color: data.primary }}
          >
            Что будет дальше
          </button>
        </div>
      </div>
    );
  if (view === "acquisition")
    return (
      <div className="min-h-screen bg-slate-200 p-5 md:p-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,760px)_1fr]">
          <img
            src={`${data.assetRoot}/acquisition-creative.svg`}
            alt="Pilot acquisition creative without client-work imagery"
            className="w-full rounded-3xl shadow-xl"
          />
          <aside className="rounded-3xl bg-white p-7">
            <p
              className="text-xs font-bold uppercase tracking-[.2em]"
              style={{ color: data.accent }}
            >
              Experiment asset
            </p>
            <h1
              className="mt-4 text-3xl"
              style={{ fontFamily: data.displayType }}
            >
              Creative with an evidence boundary
            </h1>
            <div className="mt-6 grid gap-3">
              <EvidenceChip tone="fact">no client-work claim</EvidenceChip>
              <EvidenceChip tone="promise">
                traffic only after preconditions
              </EvidenceChip>
              <EvidenceChip tone="missing">
                real photos still missing
              </EvidenceChip>
            </div>
            <p className="mt-6 text-sm leading-6" style={{ color: data.muted }}>
              The vector is identity presentation only. It cannot be launched
              until contact, capacity, consent, platform eligibility, and real
              imagery are confirmed.
            </p>
          </aside>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen p-5 md:p-12" style={pageStyle}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between">
          <Mark data={data} />
          <span
            className="text-xs font-semibold uppercase tracking-[.18em]"
            style={{ color: data.muted }}
          >
            Founder pilot · presentation only
          </span>
        </header>
        {view === "brand" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className="rounded-3xl p-8 md:p-12"
              style={{ backgroundColor: data.primary, color: data.paper }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[.2em]"
                style={{ color: data.accent }}
              >
                Identity premise
              </p>
              <h1
                className="mt-5 text-5xl leading-tight"
                style={{ fontFamily: data.displayType }}
              >
                Сначала понять состояние. Потом обещать работу.
              </h1>
              <p className="mt-6 max-w-lg leading-7 opacity-75">
                Measured, warm, and personally accountable. No invented scale,
                workshop, certification, or portfolio.
              </p>
            </section>
            <section className="grid gap-4">
              <div
                className="rounded-3xl border bg-white p-7"
                style={{ borderColor: data.line }}
              >
                <EvidenceChip tone="promise">
                  personal response · P-01 pending
                </EvidenceChip>
                <h2
                  className="mt-5 text-2xl"
                  style={{ fontFamily: data.displayType }}
                >
                  Message hierarchy
                </h2>
                <ol
                  className="mt-4 grid gap-2 text-sm"
                  style={{ color: data.muted }}
                >
                  <li>1. Understand whether assessment makes sense.</li>
                  <li>2. Explain limits before asking for contact.</li>
                  <li>3. Request useful photos and context.</li>
                  <li>4. Set a credible next action.</li>
                </ol>
              </div>
              <img
                src={`${data.assetRoot}/wordmark.svg`}
                alt="Рама pilot wordmark"
                className="w-full rounded-3xl border bg-white"
                style={{ borderColor: data.line }}
              />
            </section>
          </div>
        )}
        {view === "tokens" && (
          <div>
            <h1 className="text-5xl" style={{ fontFamily: data.displayType }}>
              Color & typography
            </h1>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Primary", data.primary],
                ["Accent", data.accent],
                ["Paper", data.paper],
                ["Ink", data.ink],
                ["Muted", data.muted],
                ["Line", data.line],
              ].map(([name, color]) => (
                <div
                  key={name}
                  className="overflow-hidden rounded-2xl border bg-white"
                  style={{ borderColor: data.line }}
                >
                  <div className="h-28" style={{ backgroundColor: color }} />
                  <div className="p-4">
                    <strong>{name}</strong>
                    <code
                      className="mt-1 block text-xs"
                      style={{ color: data.muted }}
                    >
                      {color}
                    </code>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div
                className="rounded-3xl border bg-white p-7"
                style={{ borderColor: data.line }}
              >
                <span className="text-xs" style={{ color: data.muted }}>
                  {data.displayType}
                </span>
                <p
                  className="mt-5 text-5xl"
                  style={{ color: data.primary, fontFamily: data.displayType }}
                >
                  Спокойно о сложном
                </p>
              </div>
              <div
                className="rounded-3xl border bg-white p-7"
                style={{ borderColor: data.line }}
              >
                <span className="text-xs" style={{ color: data.muted }}>
                  {data.bodyType}
                </span>
                <p className="mt-5 text-lg leading-8">
                  Прямой текст объясняет ограничение, следующий шаг и
                  ответственность без рекламного шума.
                </p>
              </div>
            </div>
          </div>
        )}
        {view === "imagery" && (
          <div>
            <h1 className="text-5xl" style={{ fontFamily: data.displayType }}>
              Imagery
            </h1>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              <div
                className="overflow-hidden rounded-3xl border bg-white lg:col-span-2"
                style={{ borderColor: data.line }}
              >
                <img
                  src={`${data.assetRoot}/frame-pattern.svg`}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="p-5">
                  <EvidenceChip tone="fact">
                    decorative · empty alt
                  </EvidenceChip>
                  <p className="mt-3 text-sm" style={{ color: data.muted }}>
                    Abstract geometry may carry identity but never represent a
                    completed job.
                  </p>
                </div>
              </div>
              <div className="grid gap-5">
                <div
                  className="grid min-h-48 place-items-center rounded-3xl border-2 border-dashed p-6 text-center"
                  style={{ borderColor: data.line }}
                >
                  <div>
                    <EvidenceChip tone="missing">M-01</EvidenceChip>
                    <p className="mt-4 text-sm">
                      Reserved for rights-cleared before/after client work.
                    </p>
                  </div>
                </div>
                <div
                  className="grid min-h-48 place-items-center rounded-3xl border-2 border-dashed p-6 text-center"
                  style={{ borderColor: data.line }}
                >
                  <p className="text-sm">
                    No generated workshop, tools, team, or heritage building.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {view === "components" && (
          <div>
            <h1 className="text-5xl" style={{ fontFamily: data.displayType }}>
              Key components
            </h1>
            <div className="mt-9 grid gap-5 lg:grid-cols-2">
              <div
                className="rounded-3xl border bg-white p-7"
                style={{ borderColor: data.line }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-[.2em]"
                  style={{ color: data.muted }}
                >
                  Actions
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <PrimaryButton data={data}>{data.primaryCta}</PrimaryButton>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border px-5 text-sm font-semibold"
                    style={{ borderColor: data.primary, color: data.primary }}
                  >
                    Как проходит работа
                  </button>
                </div>
              </div>
              <div
                className="rounded-3xl border bg-white p-7"
                style={{ borderColor: data.line }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-[.2em]"
                  style={{ color: data.muted }}
                >
                  Evidence states
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <EvidenceChip tone="fact">verified fact</EvidenceChip>
                  <EvidenceChip tone="promise">promise pending</EvidenceChip>
                  <EvidenceChip tone="missing">missing evidence</EvidenceChip>
                </div>
              </div>
              <div className="lg:col-span-2">
                <Process data={data} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
