export interface ITopicRule {
  routeTemplate: string;
  topics: string[];
  stop?: boolean;
}

export const topicRules: ITopicRule[] = [
  {
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/messages",
    topics: [
      "social",
      "social.chats.[social.chats.id].messages",
      "social.messages",
    ],
    stop: true,
  },
  {
    routeTemplate:
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/actions",
    topics: [
      "social",
      "social.chats.[social.chats.id].actions",
      "social.actions",
    ],
    stop: true,
  },
];
