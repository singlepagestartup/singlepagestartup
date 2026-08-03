# Website — «Рама» primary landing page

## Objective and visitor path

One page serves one provisional situation: a Moscow owner wants to know whether a deteriorating wooden window is worth assessing for repair (`A-01`). The path is condition → fit and limits → process → calculation principle → founder accountability → photo request → clear receipt. Commercial/protected-heritage work and instant-price expectations are excluded early.

## Final page copy

- Eyebrow: `Ремонт деревянных окон · Москва`
- Headline: `Сначала разберёмся с окном. Потом решим, что ремонтировать.`
- Subheadline: `Пришлите несколько фото и опишите проблему. Алексей лично посмотрит заявку и подскажет, нужен ли выезд для точной оценки.` `[client-claim: C-02; promise: P-01 pending]`
- Primary CTA: `Отправить фото на оценку`
- Secondary CTA: `Как проходит работа`
- Boundary note: `По фото нельзя назвать окончательную цену или гарантировать восстановление — состояние дерева и узлов проверяется на месте.`

### Is this for you?

Headline: `Когда стоит начать с оценки`. Cards: `Дует или промерзает`; `Створка задевает раму`; `Краска отслаивается, дерево темнеет или трескается`; `Хочется сохранить деревянное окно, если это разумно`. Exclusion: `На первом этапе не берём коммерческие фасады и объекты, где требуется лицензированная реставрация.`

### Offer and price principle

Headline: `Не обещаем цену до осмотра состояния`. Copy: `На расчёт влияют размер и доступ, состояние древесины и покрытия, фурнитура, материалы и выбранный результат. После фото Алексей уточнит задачу; окончательный объём появляется после осмотра.` `[constraint: U-01]`

### Process

1. `Вы отправляете фото` — общий вид, повреждение, створка и зона примыкания.
2. `Алексей уточняет задачу` — район, симптомы, доступ и желаемый результат.
3. `Если есть смысл — договариваемся об осмотре` — без обещания ремонта до проверки.
4. `Получаете понятный объём` — работы, материалы, исключения, срок и цена до начала.

### Proof and founder block

Headline: `За ответ и работу отвечает один человек`. Copy: `Пилот пока не публикует портфолио и отзывы: права на материалы не подтверждены. До их появления доверие строится на прозрачном процессе и явных ограничениях.` `[missing-evidence: M-01]`. Founder label: `Алексей Орлов · частный мастер · вымышленный pilot`.

### FAQ

- `Можно оценить всё по фото?` — `Фото помогают понять следующий шаг. Окончательная причина, объём и цена требуют осмотра.`
- `Вы всегда сохраняете окно?` — `Нет. Сначала проверяем, разумен ли ремонт. Если состояние не позволяет обещать результат, это будет сказано прямо.` `[promise: P-02]`
- `Сколько стоит работа?` — `Публичной цены пока нет: она зависит от состояния и объёма. Перед работой нужен согласованный расчёт.` `[unknown: U-01]`
- `Когда вы ответите?` — `Планируем ответ в следующий рабочий день после полной заявки.` `[promise: P-01 pending]`

## Form and success behavior

- Form title: `Покажите, что происходит с окном`
- Fields: `Как к вам обращаться?` (required); `Телефон для ответа` (required); `Район Москвы` (required); `Что происходит?` (required textarea); `Фото окна` (required, 1–6 images, future implementation limit); preferred contact (optional).
- Consent: `Отправляя заявку, вы соглашаетесь на обработку контактных данных и фотографий только для ответа и предварительной оценки. Публикация материалов требует отдельного согласия.` Legal review is required.
- Validation: keep entered text; identify the field and recovery action; never claim that a failed upload was received.
- Submit label: `Отправить заявку`
- Success title: `Фото и описание получены`
- Success copy: `Алексей проверит, хватает ли информации, и ответит в следующий рабочий день. Если фото не показывают нужный узел, он попросит другой ракурс.` `[promise: P-01 pending]`
- Post-conversion action: founder qualifies the lead using `business.md`; visitor may save the placeholder phone only after real contact details are approved. No payment or appointment is implied.

## Responsive and accessibility constraints

- Desktop: two-column hero (message/process marker), then single reading column with scoped cards; form is a dedicated final section, not a modal.
- Mobile: one column; CTA follows boundary note; process labels remain visible; no horizontal comparison or hidden legal text.
- Minimum 44px controls, persistent labels, visible keyboard focus, text plus icon for errors/success, reduced-motion-safe transitions, semantic heading order, and meaningful alt text only for evidence images.
- Decorative vectors use empty alt text. Real work photos must include stage/context and asset ID.

## Metadata and Studio references

- Title: `Рама — оценка ремонта деревянного окна в Москве`
- Description: `Пришлите фото деревянного окна и получите понятный следующий шаг: уточнение, осмотр или честный отказ от неподходящего ремонта.`
- Open Graph: `Сначала оценка состояния — потом объём работ.`
- Studio: `Founder Pilot/Brand Overview`, `Color & Typography`, `Imagery`, `Key Components`, `Primary Landing Page`, `Mobile Page`, `Form`, `Success State`, `Acquisition Creative`.
- Engineering handoff is intentionally outside issue 222. These are static, evidence-aware decisions, not production components or external integrations.
