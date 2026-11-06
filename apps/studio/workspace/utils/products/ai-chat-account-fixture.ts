/** Account values used by the Studio layout, not the service's free grant. */
export const aiChatAccount = {
  subject: { id: "current-subject" },
  profile: {
    id: "current-user",
    title: "Alex",
    avatar:
      "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-account-mascot-square.png",
    variant: "user-ai-chat" as const,
  },
  email: "alex@example.com",
  balance: { free: 250, purchased: 1000 },
};
