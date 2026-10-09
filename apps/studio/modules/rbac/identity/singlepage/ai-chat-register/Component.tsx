"use client";
import { useId, useState, type FormEvent } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import defaultCopy from "./content.json";
import type { IAIChatServicePageContent } from "../../../../../workspace/utils/products/ai-chat-content";
import {
  AccountPage,
  Feedback,
  PageSection,
  PasswordField,
  TextField,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface IRegisterProps {
  copy?: IAIChatServicePageContent;
}

export interface IRegisterErrors {
  email?: string;
  password?: string;
  repeatedPassword?: string;
}

export function Component({ copy = defaultCopy }: IRegisterProps = {}) {
  const label = copy.labels;
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [errors, setErrors] = useState<IRegisterErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email");
    const nextErrors: IRegisterErrors = {};
    if (
      !email.trim() ||
      (input instanceof HTMLInputElement && input.validity.typeMismatch)
    ) {
      nextErrors.email = label["email-error"];
    }
    if (!password) nextErrors.password = label["password-error"];
    if (!repeatedPassword || repeatedPassword !== password) {
      nextErrors.repeatedPassword = label["repeat-password-error"];
    }
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      const field = event.currentTarget.elements.namedItem(firstError);
      if (field instanceof HTMLElement) field.focus();
    }
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <AccountPage copy={copy} page="register">
      <PageSection
        section={copy.sections.account}
        icon="user-plus"
        descriptionSize="xs"
      >
        <form noValidate onSubmit={submit} className="grid content-start gap-5">
          <TextField
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            label={label["email-label"]}
            placeholder={label["email-placeholder"]}
            value={email}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
              setSubmitted(false);
            }}
          />
          <PasswordField
            id={`${id}-password`}
            name="password"
            autoComplete="new-password"
            required
            label={label["password-label"]}
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
              setSubmitted(false);
            }}
          />
          <PasswordField
            id={`${id}-repeat-password`}
            name="repeatedPassword"
            autoComplete="new-password"
            required
            label={label["repeat-password-label"]}
            value={repeatedPassword}
            error={errors.repeatedPassword}
            onChange={(event) => {
              setRepeatedPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                repeatedPassword: undefined,
              }));
              setSubmitted(false);
            }}
          />
          <a
            className={`w-fit text-sm leading-6 underline decoration-sps-line underline-offset-4 ${kit.focus}`}
            href={label["terms-href"]}
          >
            {label["terms-label"]}
          </a>
          <Button type="submit" className="w-full justify-center">
            {label.submit}
            <Icon name="arrow-right" />
          </Button>
          <p className="text-center text-sm leading-6 text-sps-muted">
            {label["existing-account"]}{" "}
            <a
              className={`font-semibold text-sps-graphite underline underline-offset-4 ${kit.focus}`}
              href={label["sign-in-href"]}
            >
              {label["sign-in-label"]}
            </a>
          </p>
        </form>
        {submitted ? (
          <div className="mt-6 grid gap-4">
            <Feedback kind="success">{label["success-message"]}</Feedback>
            <p className="text-sm leading-6 text-sps-muted">
              {copy.sections.success.paragraphs.join(" ")}
            </p>
            <a
              className={`${kit.secondary} w-fit`}
              href={label["continue-href"]}
            >
              {label["continue-label"]}
              <Icon name="arrow-right" />
            </a>
          </div>
        ) : null}
      </PageSection>
    </AccountPage>
  );
}
