---
description: Подготовить или продолжить работу Studio в выбранном разделе.
argument-hint: "[--section brief|products|competitors|semantics|strategy|brand|design|materials] [--product ID] [--skip|--complete|--next]"
---

# Адаптер команды для Claude

Прочитать `.agents/workflows/pre-development.md` целиком. Передать аргументы `$ARGUMENTS` в `npm run singlepagestartup -- ...`. Доступные инструменты определяются через `.agents/tools/providers/claude.yaml`. Работать в разделе, который вернула команда: диагностика и история проверки не меняют его и не требуют завершения предыдущих этапов.

Документы и пояснения оператору писать по-русски. Идентификаторы, пути, команды, ссылки и технические поля сохранять.

При работе со статьями прочитать `.agents/references/seo-articles.md` и применять его вместе с шаблоном статьи.
