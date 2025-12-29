# Host Module API Requests

Коллекция HTTP запросов для тестирования API модуля Host.

## Структура

Запросы разделены по моделям и отношениям:

### Models

- [layout.http](layout.http) - CRUD операции для layouts
- [page.http](page.http) - CRUD операции для pages (включая пагинацию и фильтрацию)
- [metadata.http](metadata.http) - CRUD операции для metadata
- [widget.http](widget.http) - CRUD операции для widgets

### Relations

- [layouts-to-widgets.http](layouts-to-widgets.http) - Связи между layouts и widgets
- [pages-to-layouts.http](pages-to-layouts.http) - Связи между pages и layouts

## Использование

1. Выберите окружение через команду "HttpYac: Select Environment" (dev/local/prod)
2. Откройте нужный .http файл
3. Нажмите "Send Request" над нужным запросом

## Переменные

Переменные окружения настроены в `.httpyac.json`:

- `{{baseUrl}}` - базовый URL API
- `{{contentType}}` - тип контента (application/json)

Локальные переменные можно определять прямо в файлах:

```
@layoutId = your-layout-id-here
```
