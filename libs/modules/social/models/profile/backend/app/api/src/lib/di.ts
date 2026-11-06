export const ProfileDI = {
  IAuthorDependencies: Symbol.for("social.profile.author.dependencies"),
  IChatsService: Symbol.for("social.profile.chats.service"),
  IProfilesToChatsService: Symbol.for(
    "social.profile.profiles-to-chats.service",
  ),
};
