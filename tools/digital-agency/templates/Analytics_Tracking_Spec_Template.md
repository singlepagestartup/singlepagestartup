## Analytics Tracking Specification (шаблон для ИИ-агента)

Внимание: шаблон предназначен для автоматического заполнения ИИ-агентом на основе входных артефактов: Tech_Setup_Plan.md, Integration_Map.md, Website_Deployment_Report.md, QA_Report.md, Marketing_Strategy.md. Не добавлять произвольных полей, не предусмотренных структурой.

**Важно:** Проект ориентирован на российский рынок. Обязательно включить российские платформы аналитики: Яндекс.Метрика (поведенческая аналитика), VK Pixel (ретаргетинг и конверсии), OK Pixel (ретаргетинг и конверсии). Для корректного расчёта ROMI использовать валюту RUB во всех финансовых событиях.

---

### 1. Системы и идентификаторы

| Система        | Идентификатор      | Назначение                       |
| -------------- | ------------------ | -------------------------------- |
| GA4            | G-XXXXXXXXX        | Веб-аналитика и события          |
| GTM            | GTM-XXXXXXX        | Контейнер, маршрутизация событий |
| Meta Pixel     | XXXXXXXXXXXXXXXX   | Ретаргетинг и конверсии          |
| Яндекс Метрика | XXXXXXXXX          | Поведенческий анализ (РФ)        |
| VK Pixel       | XXXXXXXXX          | Ретаргетинг и конверсии (РФ)     |
| OK Pixel       | XXXXXXXXX          | Ретаргетинг и конверсии (РФ)     |
| TikTok Pixel   | XXXXXXXXX          | Ретаргетинг и конверсии          |
| CRM            | base_url / api_key | Лиды, статусы, выручка           |
| ESP            | base_url / api_key | Подписки, рассылки               |

**Примечание для российского рынка:** Проект ориентирован на российский рынок. Обязательно включить VK Pixel и OK Pixel для полного покрытия аудитории и ретаргетинга. Яндекс.Метрика — основной инструмент поведенческой аналитики в РФ.

Обязательные глобальные идентификаторы, используемые во всех событиях:

- client_id, session_id, user_id (если авторизован), lead_id (если есть), page_location, page_referrer, page_title, language, device_category, utm_source, utm_medium, utm_campaign, utm_content, utm_term.

---

### 2. Таксономия событий (все события и параметры)

2.1. Стандартные веб-события (GA4):

- page_view: { page_location, page_referrer }
- session_start: { engagement_time_msec }

  2.2. Воронка лида (Lead):

- form_view: { form_id, form_name }
- form_start: { form_id, form_name }
- form_submit: { form_id, form_name, validation_state, fields_present[] }
- form_submit_success: { form_id, form_name, lead_id, lead_source, lead_medium, lead_campaign }
- form_submit_error: { form_id, form_name, error_code, error_message }

  2.3. E‑commerce (если применимо):

- view_item_list: { item_list_id, item_list_name, items[] }
- view_item: { items[] }
- select_item: { item_list_id, item_list_name, items[] }
- add_to_cart: { currency, value, items[] }
- begin_checkout: { currency, value, coupon?, items[] }
- add_payment_info: { payment_type, currency, value, items[] }
- purchase: { transaction_id, currency, value, tax, shipping, coupon?, items[] }

Структура items[]:
{ item_id, item_name, item_category, item_variant?, price, quantity }

2.4. Взаимодействие и контент:

- click_cta: { element_id, element_text, section, destination_url }
- outbound_click: { link_url, link_domain }
- video_start: { video_id, video_title, seconds=0 }
- video_progress: { video_id, progress_percent, seconds }
- video_complete: { video_id, seconds }
- download: { file_name, file_type, file_url }
- share: { platform, content_id }

  2.5. Качество UX/техошибки:

- js_error: { message, filename, lineno, colno, stack? }
- api_error: { endpoint, method, status_code, duration_ms }

  2.6. Core Web Vitals (по возможности через Web‑Vitals в GA4 custom metrics):

- web_vitals_lcp: { lcp_ms }
- web_vitals_cls: { cls_value }
- web_vitals_fid: { fid_ms }
- ttfb: { ttfb_ms }

Примечания:

- Все события должны включать глобальные параметры идентификации и UTM.
- Для purchase/lead обязателен currency/value (если применимо) для расчёта ROMI/CAC/LTV.

---

### 3. Карта соответствий (mapping) по системам

| GA4                 | Meta Pixel                  | Яндекс Метрика         | VK Pixel         | OK Pixel         | TikTok Pixel     |
| ------------------- | --------------------------- | ---------------------- | ---------------- | ---------------- | ---------------- |
| page_view           | PageView                    | hit: pageview          | PageView         | PageView         | PageView         |
| view_item           | ViewContent                 | reachGoal: view_item   | ViewContent      | ViewContent      | ViewContent      |
| add_to_cart         | AddToCart                   | reachGoal: add_to_cart | AddToCart        | AddToCart        | AddToCart        |
| begin_checkout      | InitiateCheckout            | reachGoal: checkout    | InitiateCheckout | InitiateCheckout | InitiateCheckout |
| purchase            | Purchase                    | reachGoal: purchase    | Purchase         | Purchase         | Purchase         |
| form_submit_success | Lead / CompleteRegistration | reachGoal: lead        | Lead             | Lead             | Lead             |
| click_cta           | —                           | reachGoal: click_cta   | —                | —                | —                |

**Правила передачи value/currency:** одинаковые значения и валюта во всех системах для сопоставимости ROMI. Для российских платформ (Яндекс.Метрика, VK Pixel, OK Pixel) обязательно передавать value в рублях (RUB) для корректного расчёта ROMI на российском рынке.

**Особенности российских платформ:**

- **Яндекс.Метрика:** использует цели (goals) и события (events). Для конверсий — `reachGoal`, для событий — `hit` с типом события.
- **VK Pixel:** события через VK Pixel API (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead). Обязателен параметр `value` для финансовых событий.
- **OK Pixel:** события через OK Pixel API (аналогично VK Pixel). Требуется корректная передача `value` и `currency` для purchase событий.

---

### 4. Спецификация dataLayer (GTM) — форматы событий

4.1. Общий каркас

```json
{
  "event": "<event_name>",
  "event_time": "<ISO8601>",
  "client_id": "<string>",
  "session_id": "<string>",
  "user_id": "<string|null>",
  "utm": { "source": "", "medium": "", "campaign": "", "content": "", "term": "" },
  "context": { "page_location": "", "page_referrer": "", "page_title": "", "language": "", "device_category": "" }
}
```

4.2. Пример lead‑события

```json
{
  "event": "form_submit_success",
  "form_id": "contact_us",
  "form_name": "Contact Us",
  "lead_id": "L-12345",
  "lead_source": "website",
  "lead_medium": "paid",
  "lead_campaign": "spring_sale",
  "client_id": "<cid>",
  "session_id": "<sid>",
  "utm": { "source": "google", "medium": "cpc", "campaign": "brand", "content": "cta_a", "term": "brand" },
  "context": { "page_location": "https://example.com/", "page_referrer": "https://google.com/", "page_title": "Home", "language": "ru-RU", "device_category": "mobile" }
}
```

4.3. Пример purchase

```json
{
  "event": "purchase",
  "transaction_id": "T-98765",
  "currency": "RUB",
  "value": 14999.0,
  "tax": 0,
  "shipping": 0,
  "items": [{ "item_id": "SKU-1", "item_name": "Plan A", "item_category": "subscription", "price": 14999.0, "quantity": 1 }],
  "client_id": "<cid>",
  "session_id": "<sid>",
  "utm": { "source": "vk", "medium": "cpc", "campaign": "spring_sale", "content": "banner_a", "term": "" },
  "context": { "page_location": "https://example.com/checkout", "page_referrer": "https://vk.com/", "page_title": "Checkout", "language": "ru-RU", "device_category": "desktop" }
}
```

**Примечание для российского рынка:** Для проектов на российском рынке использовать валюту RUB во всех финансовых событиях (purchase, add_to_cart, begin_checkout). Это обеспечит корректный расчёт ROMI в Яндекс.Метрика, VK Pixel и OK Pixel.

---

### 5. Метрики и вычисления (что должно быть измеримо)

Финансово-ключевые:

- ROMI, ROI = (Revenue - Cost) / Cost
- CAC, CPL, CPA
- LTV (модель и горизонты), AOV/ARPPU

Продукт/воронка:

- Conversion Rate по этапам (visit→lead→sale)
- Funnel drop‑off по формам/экранам
- Retention/Repeat purchase (если применимо)

Медиа и креативы:

- CTR, CPC, CPM, Reach/Frequency (через интеграцию с рекламными системами)

Производительность и UX:

- LCP, CLS, FID, TTFB; error rate (js_error/api_error)

Источники расчёта: GA4 (events, user_properties), CRM (revenue, lead_status), ESP (email events), Ad accounts (costs, clicks, impressions).

---

### 6. Метрики, которые НЕ собираем (не дают управленческих выводов)

- Сырые «время на странице» и «глубина скролла» без связи с целевыми действиями
- Количество наведения мыши/mousemove, resize, бессмысленные heatmap‑события
- Bounce Rate (legacy) как главную метрику без контекста GA4 engaged sessions
- Абстрактные «лайки/подписки» без UTM и связки с лидами/выручкой
- Дублирующие события (scroll на 10/25/50/75/90 без использования)
- Произвольные «оценочные» шкалы без валидированной методики

Если метрика не используется в принятии решений (ROMI/CAC/LTV/CR), её сбор исключается.

---

### 7. Контроль качества данных (Data Quality)

- Единые идентификаторы (client_id/user_id/lead_id) сквозь сайт→CRM→ESP→Analytics
- Валидация UTM (таблица допустимых значений из медиаплана)
- Сверка value/currency между GA4/Meta/Яндекс.Метрика/VK/OK/CRM (для российских платформ — обязательная сверка валюты RUB)
- Отсутствие PII в событиях (соблюдение GDPR/152‑ФЗ); использование Consent Mode
- Тест‑прогоны: GTM Preview/GA4 DebugView/Яндекс.Метрика Webvisor/VK Pixel Debug/OK Pixel Debug/CRM Logs; чек‑лист прохождения
- **Специфика российских платформ:** Яндекс.Метрика — проверка через Webvisor и счётчик; VK Pixel — через VK Ads Manager → Pixel Debug; OK Pixel — через OK Ads Manager → Pixel Debug

---

### 8. Результаты тестирования и проверки интеграций

| Система аналитики | Статус подключения | Метод проверки                    | Результат | Обнаруженные проблемы |
| ----------------- | ------------------ | --------------------------------- | --------- | --------------------- |
| GA4               | ✅ / ❌            | GTM Preview, GA4 DebugView        | —         | —                     |
| GTM               | ✅ / ❌            | GTM Preview Mode                  | —         | —                     |
| Meta Pixel        | ✅ / ❌            | Meta Events Manager, Pixel Helper | —         | —                     |
| Яндекс Метрика    | ✅ / ❌            | Webvisor, счётчик, цели (goals)   | —         | —                     |
| VK Pixel          | ✅ / ❌            | VK Ads Manager → Pixel Debug      | —         | —                     |
| OK Pixel          | ✅ / ❌            | OK Ads Manager → Pixel Debug      | —         | —                     |
| TikTok Pixel      | ✅ / ❌            | TikTok Events Manager             | —         | —                     |
| CRM интеграция    | ✅ / ❌            | CRM Logs, тестовая отправка лида  | —         | —                     |
| ESP интеграция    | ✅ / ❌            | ESP Logs, тестовая подписка       | —         | —                     |

**Примечания по проверке:**

- Для каждой системы указать дату и время последней проверки
- Зафиксировать все найденные несоответствия (например, расхождение value/currency, отсутствие событий, проблемы с идентификаторами)
- Указать рекомендации по исправлению выявленных проблем

**Специфика проверки российских платформ:**

- Яндекс.Метрика: проверить работу Webvisor, корректность счётчика и целей (goals), сверка value/currency (RUB)
- VK Pixel: проверить через VK Ads Manager → Pixel Debug, корректность передачи событий и value
- OK Pixel: проверить через OK Ads Manager → Pixel Debug, корректность передачи событий и value

---

### 9. Статус готовности и рекомендации

**Статус готовности:** ✅ Готов / ⚠️ Требует доработки / ❌ Не готов

**Общий статус систем аналитики:**

- [ ] Все системы подключены и протестированы
- [ ] Все события корректно передаются во все системы
- [ ] Идентификаторы синхронизированы между системами
- [ ] Value/currency сверены (RUB для российских платформ)
- [ ] UTM-параметры валидированы
- [ ] PII исключены из событий, Consent Mode настроен

**Рекомендации по доработке:**

- Перечислить найденные проблемы и шаги по их устранению
- Указать приоритет доработок (критично / важно / желательно)
