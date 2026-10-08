/** Account values used by the Studio layout, not the service's free grant. */
export const aiChatAccount = {
  subject: { id: "current-subject" },
  profiles: [
    { id: "current-user", title: "Profile", variant: "ai-chat-user" as const },
  ],
  subjectsToProfiles: [
    {
      id: "current-subject:current-user",
      subjectId: "current-subject",
      socialModuleProfileId: "current-user",
    },
  ],
  email: "you@example.com",
  balance: { free: 250, purchased: 1000 },
};
