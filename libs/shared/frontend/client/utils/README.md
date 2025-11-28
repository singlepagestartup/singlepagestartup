# Client Utils

Библиотека клиентских утилит для SinglePageStartup (SPS). Содержит набор функций для работы с авторизацией, заголовками и другими клиентскими задачами.

## Структура

```
src/
├── lib/
│   ├── authorization/    # Утилиты авторизации
│   │   └── headers.ts    # Получение заголовков авторизации из cookies
│   ├── saturate-headers/ # Обработка заголовков
│   │   └── index.ts      # Объединение пользовательских и авторизационных заголовков
│   └── cn/              # Утилиты для работы с CSS классами
```

## Основные функции

### Авторизация и заголовки

- `authorization.headers()` - Получение заголовков авторизации из cookies

  ```typescript
  const headers = authorization.headers();
  // Возвращает объект с заголовками:
  // {
  //   Authorization: "Bearer <jwt>",
  //   "X-RBAC-SECRET-KEY": "<secret-key>"
  // }
  ```

- `saturateHeaders(userHeaders?)` - Объединение пользовательских и авторизационных заголовков
  ```typescript
  const headers = saturateHeaders({ "Content-Type": "application/json" });
  // Возвращает объединенные заголовки с авторизацией
  ```

### CSS классы

- `cn(...inputs)` - Утилита для условного объединения CSS классов
  ```typescript
  const className = cn("base-class", condition && "conditional-class", { "object-class": true });
  ```

## Использование

```typescript
import { authorization, saturateHeaders, cn } from "@sps/shared/frontend/client/utils";

// Пример работы с заголовками
const headers = saturateHeaders({
  "Content-Type": "application/json",
  "Custom-Header": "value",
});

// Пример работы с CSS классами
const buttonClass = cn("button", isActive && "button--active", { "button--disabled": isDisabled });
```

## Примечания

- Все функции работают на клиентской стороне
- Авторизационные заголовки автоматически добавляются к запросам
- Утилита `cn` использует библиотеку `clsx` для работы с классами

## Тестирование

Библиотека использует Jest для тестирования. Конфигурация тестов находится в `jest.config.ts`.

## Лицензия

MIT
