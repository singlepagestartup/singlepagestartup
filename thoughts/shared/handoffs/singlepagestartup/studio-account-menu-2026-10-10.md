# Studio: единое меню пользователя

Ветка: `codex/studio-host-models`. PR: https://github.com/singlepagestartup/singlepagestartup/pull/371, ветка PR `codex/ai-chat-ui-review`.

План: `thoughts/shared/plans/singlepagestartup/2026-10-10-studio-account-menu.md`.

Текущее состояние: реализация готова. Subject `account` и Social Profile
`account-menu` заменяют старые меню. `showTokens` включает баланс и Buy tokens;
аватар, имя, email, Settings, Change avatar, Admin Panel и Sign out едины.
Локальная сессия и аватар синхронизируются через существующее хранилище RBAC.
Host Login обрабатывает `Identity.onSuccess` и сразу открывает активный проект.
Мастер маскота и квадратная версия сохранены в generated/living-focus; источник
и промпты находятся в assets/singlepage.yaml.

Проверки: 283 pass, 0 fail; TypeScript и Studio validate прошли. Root Storybook
и изолированная копия Studio без production-папок собираются. Браузер подтверждает
вход без дополнительного клика, общий вид меню, загрузку и сохранение аватара,
отсутствие токенов в блоге, выход и мобильные границы при ширине 320 px.
Скриншоты: /private/tmp/studio-account-final.png, /private/tmp/studio-account-blog.png,
/private/tmp/studio-account-mobile.png. Storybook запущен на 4321.

Публикация завершена: root-коммит `ccb3307dd1`, коммит реализации в PR
`861f0912a93bc767a8baa657bca4839cdfe64958`. Удалённый HEAD и описание PR проверены.
Собственных незавершённых изменений UI нет. Последующие изменения продолжаются
по новым комментариям пользователя; текущая реализация готова к ревью.

Область изменений: только Studio, его assets, проверки tools/studio и эти artifacts. Чужие изменения в production, workspace business docs и agent tooling не включать в коммит.

Публикация: root содержит посторонний production-коммит `94f63c6a75`. Не пушить root напрямую. Собственные SHA cherry-pick в временный worktree от HEAD ветки PR, проверить diff и выполнить обычный push без force.
