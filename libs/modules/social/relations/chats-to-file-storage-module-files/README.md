# Social chat files

Each relation links a social chat (`chatId`) to a file (`fileStorageModuleFileId`). Use the `cover` variant for a chat cover. Each chat can have one cover. Removing the chat or file removes its relation.

The relation exposes the standard CRUD and count routes under `/api/social/chats-to-file-storage-module-files`.
