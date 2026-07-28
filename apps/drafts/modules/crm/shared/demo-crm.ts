export type CrmInputVariant =
  | "text-default"
  | "textarea-default"
  | "select-option-default";

export interface CrmOptionRecord {
  id: string;
  title: string;
  value: string;
  description?: string;
}

export interface CrmInputRecord {
  id: string;
  slug: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  variant: CrmInputVariant;
  options?: CrmOptionRecord[];
}

export interface CrmStepRecord {
  id: string;
  title: string;
  description: string;
  inputs: CrmInputRecord[];
}

export interface CrmFormRecord {
  id: string;
  title: string;
  description: string;
  steps: CrmStepRecord[];
  submitLabel: string;
  successLabel: string;
}

export interface CrmRequestRecord {
  id: string;
  formTitle: string;
  subjectName: string;
  status: string;
  createdAt: string;
  summary: string;
}

export const defaultCrmOptions: CrmOptionRecord[] = [
  {
    id: "option-website",
    title: "Website build",
    value: "website-build",
    description: "Landing pages, marketing sites, and product pages.",
  },
  {
    id: "option-saas",
    title: "SaaS product",
    value: "saas-product",
    description: "Dashboard, auth, billing, and product workflows.",
  },
  {
    id: "option-consulting",
    title: "Technical consulting",
    value: "technical-consulting",
    description: "Architecture review and delivery planning.",
  },
];

export const defaultCrmForm: CrmFormRecord = {
  id: "crm-form-project-request",
  title: "Project Request",
  description:
    "Collect contact details, project scope, and timeline before creating a CRM request.",
  submitLabel: "Send request",
  successLabel: "Request captured in CRM",
  steps: [
    {
      id: "crm-step-contact",
      title: "Contact",
      description: "Identify the subject and primary contact channel.",
      inputs: [
        {
          id: "crm-input-first-name",
          slug: "firstName",
          label: "First Name",
          placeholder: "John",
          required: true,
          variant: "text-default",
        },
        {
          id: "crm-input-last-name",
          slug: "lastName",
          label: "Last Name",
          placeholder: "Doe",
          required: true,
          variant: "text-default",
        },
        {
          id: "crm-input-email",
          slug: "email",
          label: "Email",
          placeholder: "john@example.com",
          required: true,
          type: "email",
          variant: "text-default",
        },
      ],
    },
    {
      id: "crm-step-project",
      title: "Project",
      description: "Capture the CRM form inputs that belong to the request.",
      inputs: [
        {
          id: "crm-input-company",
          slug: "company",
          label: "Company",
          placeholder: "Acme Inc.",
          variant: "text-default",
        },
        {
          id: "crm-input-service",
          slug: "service",
          label: "Service",
          placeholder: "Select a service",
          required: true,
          variant: "select-option-default",
          options: defaultCrmOptions,
        },
        {
          id: "crm-input-message",
          slug: "message",
          label: "Message",
          placeholder: "Tell us about your project...",
          required: true,
          variant: "textarea-default",
        },
      ],
    },
  ],
};

export const defaultCrmRequest: CrmRequestRecord = {
  id: "crm-request-demo",
  formTitle: defaultCrmForm.title,
  subjectName: "Current subject",
  status: "Draft",
  createdAt: "Feb 20, 2026",
  summary:
    "A project request created from the subject-owned CRM form composition.",
};
