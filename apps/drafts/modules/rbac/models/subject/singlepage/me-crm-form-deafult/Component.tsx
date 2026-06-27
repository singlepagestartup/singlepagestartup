/**
 * rbac.subject.me-crm-form-deafult
 *
 * Static CRM contact form for the current subject. It is presentation-only in
 * drafts: inputs are read-only and no submit behavior is wired here.
 */
function TextField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        type={type}
        placeholder={placeholder}
        readOnly
      />
    </label>
  );
}

export const defaultSubjectMeCrmFormDefaultProps = {
  firstNameLabel: "First Name",
  firstNamePlaceholder: "John",
  lastNameLabel: "Last Name",
  lastNamePlaceholder: "Doe",
  emailLabel: "Email",
  emailPlaceholder: "john@example.com",
  companyLabel: "Company",
  companyPlaceholder: "Acme Inc.",
  messageLabel: "Message",
  messagePlaceholder: "Tell us about your project...",
  submitLabel: "Send Message",
};

export type SubjectMeCrmFormDefaultProps =
  typeof defaultSubjectMeCrmFormDefaultProps;

export function SubjectMeCrmFormDefault(
  props?: Partial<SubjectMeCrmFormDefaultProps>,
) {
  const {
    firstNameLabel,
    firstNamePlaceholder,
    lastNameLabel,
    lastNamePlaceholder,
    emailLabel,
    emailPlaceholder,
    companyLabel,
    companyPlaceholder,
    messageLabel,
    messagePlaceholder,
    submitLabel,
  } = { ...defaultSubjectMeCrmFormDefaultProps, ...props };

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-6"
      data-ds-block="rbac.subject.me-crm-form-deafult"
      data-ds-layer="singlepage"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={firstNameLabel}
            placeholder={firstNamePlaceholder}
          />
          <TextField label={lastNameLabel} placeholder={lastNamePlaceholder} />
        </div>
        <TextField
          label={emailLabel}
          placeholder={emailPlaceholder}
          type="email"
        />
        <TextField label={companyLabel} placeholder={companyPlaceholder} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {messageLabel}
          </span>
          <textarea
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            rows={4}
            placeholder={messagePlaceholder}
            readOnly
          />
        </label>
        <button
          className="w-full rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
          type="button"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
