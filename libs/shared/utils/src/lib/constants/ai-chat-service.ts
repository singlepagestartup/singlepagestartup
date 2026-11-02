export const AI_CHAT_HELP_CONTENT = {
  sections: {
    hero: {
      title: "What stopped you?",
      paragraphs: [
        "Tell us what you were trying to do, what happened and the result you need. Name the project or payment when it matters to the question.",
      ],
      items: [],
      links: [],
    },
    request: {
      title: "Support request",
      paragraphs: [],
      items: [
        {
          title: "Topic",
          text: "Choose the part of AI Chat your question concerns.",
        },
        {
          title: "What happened?",
          text: "Describe the action, the result and any message you saw.",
        },
        {
          title: "What result do you need?",
          text: "Explain what you want to continue or correct.",
        },
      ],
      links: [],
    },
    topics: {
      title: "Choose a topic",
      paragraphs: [],
      items: [
        {
          title: "Account access",
          text: "Registration, sign-in or password help.",
        },
        {
          title: "Project documents",
          text: "Drafts, identified shortcomings, edits and review.",
        },
        {
          title: "Files and images",
          text: "Adding material or working with supplied files.",
        },
        {
          title: "Chat threads and topics",
          text: "Document discussions and project conversations.",
        },
        {
          title: "Export",
          text: "Downloading and using your documents.",
        },
        {
          title: "Tokens and payment",
          text: "Balance, top-ups, receipts or a payment result.",
        },
        {
          title: "Other",
          text: "Another question about AI Chat.",
        },
      ],
      links: [],
    },
    response: {
      title: "What happens next",
      paragraphs: [
        "Support requests are processed within 24 hours. This is the initial response expectation, not a promise to resolve every request within that time. Continuous live support is outside the current service.",
        "Keep your saved documents and task in place while you wait. [Return to the workspace](/ai-chat/social/profiles/example).",
      ],
      items: [],
      links: [
        {
          text: "Return to the workspace",
          href: "/ai-chat/social/profiles/example",
        },
      ],
    },
    success: {
      title: "Request submitted",
      paragraphs: [
        "We’ll respond within 24 hours. You can keep working in your workspace while you wait.",
      ],
      items: [],
      links: [],
    },
    controls: {
      title: "Interface labels",
      paragraphs: [],
      items: [
        {
          title: "back-label",
          text: "Back to workspace",
        },
        {
          title: "back-href",
          text: "/ai-chat/social/profiles/example",
        },
        {
          title: "topic-label",
          text: "Topic",
        },
        {
          title: "topic-placeholder",
          text: "Select a topic",
        },
        {
          title: "details-label",
          text: "What happened?",
        },
        {
          title: "details-placeholder",
          text: "Describe what you tried and what happened.",
        },
        {
          title: "result-label",
          text: "What result do you need?",
        },
        {
          title: "result-placeholder",
          text: "Tell us what you want to continue or correct.",
        },
        {
          title: "submit",
          text: "Send request",
        },
        {
          title: "edit-request",
          text: "Edit request",
        },
        {
          title: "return-label",
          text: "Return to workspace",
        },
        {
          title: "return-href",
          text: "/ai-chat/social/profiles/example",
        },
        {
          title: "topic-error",
          text: "Choose a topic.",
        },
        {
          title: "details-error",
          text: "Describe what happened.",
        },
        {
          title: "result-error",
          text: "Tell us what result you need.",
        },
        {
          title: "success-message",
          text: "Support request submitted.",
        },
      ],
      links: [],
    },
  },
  labels: {
    "back-label": "Back to workspace",
    "back-href": "/ai-chat/social/profiles/example",
    "topic-label": "Topic",
    "topic-placeholder": "Select a topic",
    "details-label": "What happened?",
    "details-placeholder": "Describe what you tried and what happened.",
    "result-label": "What result do you need?",
    "result-placeholder": "Tell us what you want to continue or correct.",
    submit: "Send request",
    "edit-request": "Edit request",
    "return-label": "Return to workspace",
    "return-href": "/ai-chat/social/profiles/example",
    "topic-error": "Choose a topic.",
    "details-error": "Describe what happened.",
    "result-error": "Tell us what result you need.",
    "success-message": "Support request submitted.",
  },
};
export const AI_CHAT_SUPPORT_FORM_CONTENT = {
  title: "Support request",
  fields: {
    topic: {
      label: "Topic",
      placeholder: "Select a topic",
    },
    details: {
      label: "What happened?",
      placeholder: "Describe what you tried and what happened.",
    },
    result: {
      label: "What result do you need?",
      placeholder: "Tell us what you want to continue or correct.",
    },
  },
  topics: [
    "Account access",
    "Project documents",
    "Files and images",
    "Chat threads and topics",
    "Export",
    "Tokens and payment",
    "Other",
  ],
};
export const AI_CHAT_SUPPORT_CONTENT = {
  labels: {
    submit: "Send request",
    "edit-request": "Edit request",
    "return-label": "Return to workspace",
    "return-href": "/ai-chat/social/profiles/example",
    "topic-error": "Choose a topic.",
    "details-error": "Describe what happened.",
    "result-error": "Tell us what result you need.",
    "success-message": "Support request submitted.",
  },
  successParagraphs: [
    "We’ll respond within 24 hours. You can keep working in your workspace while you wait.",
  ],
};
export const AI_CHAT_MATERIALS_PROCESSING =
  "## How your materials are processed and stored\n\nThe service and your uploaded materials are hosted on a Contabo server in Amsterdam. The original materials and their search representations remain in the service's own storage and PostgreSQL database, with pgvector storing the vectors used to find relevant passages.\n\nDocument text is sent to OpenRouter to create those search representations. Relevant passages are also sent through OpenRouter as context for an AI answer. These requests are handled under the selected provider's terms; uploading a file does not keep its text entirely inside this service.\n\nDeleting your account removes the account and active project data the service controls. Contabo backups may retain copies for up to six months after deletion, and the service cannot shorten that period.\n\nThis information is available before registration and upload, and beside the account-deletion action in Settings.\n";

export const AI_CHAT_AUTHENTICATION_CONTENT = {
  intro: {
    title: "Your files and conversations are waiting.",
    paragraphs: [
      "Sign in to return to your last active project or the task you paused. Each document's thread keeps its discussion and draft; project topics keep their attached documents.",
    ],
  },
  images: [
    {
      src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
      alt: "A smiling maker in a pottery studio.",
      assetId:
        "singlepage-generated-living-focus-photography-work-in-motion-square",
    },
  ],
  aside: {
    title: "Trouble signing in?",
    paragraphs: [
      "Forgot your password? [Contact support](/ai-chat/help). If sign-in fails, check your details and try again.",
      "No account yet? [Create one](/ai-chat/create-account).",
    ],
  },
};

export const AI_CHAT_REGISTRATION_CONTENT = {
  intro: {
    title: "Bring your project into chat.",
    paragraphs: [
      "Create an account to add your notes, files and images. Work with AI in each document's thread, then use saved documents in new project conversations.",
    ],
  },
  images: [
    {
      src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png",
      alt: "A woman working on her project with a laptop and notebook.",
      assetId:
        "singlepage-generated-living-focus-photography-project-start-v1-square",
    },
    {
      src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-project-progress-v1-square.png",
      alt: "A man reviewing a project sketch beside his laptop.",
      assetId:
        "singlepage-generated-living-focus-photography-project-progress-v1-square",
    },
  ],
  aside: {
    title: "Before you add files",
    paragraphs: [
      "Read [How your materials are processed and stored](/ai-chat/projects#how-your-materials-are-processed-and-stored), including external AI processing and backup retention after deletion.",
    ],
  },
};
