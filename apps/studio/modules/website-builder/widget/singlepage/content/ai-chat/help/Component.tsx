"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import defaultCopy from "./content.json";
import type { IAIChatServicePageContent } from "../../../../../../../workspace/utils/products/ai-chat-content";
import {
  Feedback,
  PageSection,
  SectionText,
  ServicePage,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface IHelpProps {
  copy?: IAIChatServicePageContent;
  projectHref?: string;
}

export interface IHelpErrors {
  topic?: string;
  details?: string;
  result?: string;
}

export function Component({
  copy = defaultCopy,
  projectHref,
}: IHelpProps = {}) {
  const { sections, labels } = copy;
  const id = useId();
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<IHelpErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const topicField = useRef<HTMLButtonElement>(null);
  const detailsField = useRef<HTMLTextAreaElement>(null);
  const resultField = useRef<HTMLTextAreaElement>(null);

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: IHelpErrors = {};
    if (!topic) nextErrors.topic = labels["topic-error"];
    if (!details.trim()) nextErrors.details = labels["details-error"];
    if (!result.trim()) nextErrors.result = labels["result-error"];
    setErrors(nextErrors);
    if (nextErrors.topic) topicField.current?.focus();
    else if (nextErrors.details) detailsField.current?.focus();
    else if (nextErrors.result) resultField.current?.focus();
    else setSubmitted(true);
  }

  return (
    <ServicePage copy={copy} projectHref={projectHref}>
      <div className="grid min-w-0 items-start gap-6 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PageSection section={sections.request} icon="chat-circle">
          {submitted ? (
            <div className="mt-5 grid gap-5">
              <Feedback kind="success">{labels["success-message"]}</Feedback>
              <SectionText section={sections.success} />
              <dl className="grid gap-5 rounded-xl bg-sps-grey p-5">
                {[
                  { label: labels["topic-label"], value: topic },
                  { label: labels["details-label"], value: details },
                  { label: labels["result-label"], value: result },
                ].map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className={kit.label}>{item.label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-sps-muted">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setSubmitted(false)}>
                  <Icon name="pencil-simple" />
                  {labels["edit-request"]}
                </Button>
                <a href={labels["return-href"]} className={kit.button}>
                  {labels["return-label"]}
                  <Icon name="arrow-right" />
                </a>
              </div>
            </div>
          ) : (
            <form
              className="mt-6 grid gap-5"
              onSubmit={submitRequest}
              noValidate
            >
              <div className="grid gap-2">
                <label htmlFor={`${id}-topic`} className={kit.label}>
                  {labels["topic-label"]}
                </label>
                <Select
                  ref={topicField}
                  id={`${id}-topic`}
                  name="topic"
                  value={topic}
                  onValueChange={(value) => {
                    setTopic(value);
                    setErrors((current) => ({ ...current, topic: undefined }));
                  }}
                  placeholder={labels["topic-placeholder"]}
                  aria-label={labels["topic-label"]}
                  aria-invalid={Boolean(errors.topic)}
                  aria-describedby={
                    errors.topic ? `${id}-topic-error` : undefined
                  }
                  required
                  options={sections.topics.items.map((item) => ({
                    value: item.title,
                    label: item.title,
                  }))}
                />
                {errors.topic && (
                  <p
                    id={`${id}-topic-error`}
                    className="text-sm text-sps-danger"
                    role="alert"
                  >
                    {errors.topic}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${id}-details`} className={kit.label}>
                  {labels["details-label"]}
                </label>
                <textarea
                  ref={detailsField}
                  id={`${id}-details`}
                  name="details"
                  className={`${kit.field} min-h-36 resize-y py-3`}
                  value={details}
                  onChange={(event) => {
                    setDetails(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      details: undefined,
                    }));
                  }}
                  placeholder={labels["details-placeholder"]}
                  required
                  aria-invalid={Boolean(errors.details)}
                  aria-describedby={
                    errors.details ? `${id}-details-error` : undefined
                  }
                />
                {errors.details && (
                  <p
                    id={`${id}-details-error`}
                    className="text-sm text-sps-danger"
                    role="alert"
                  >
                    {errors.details}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${id}-result`} className={kit.label}>
                  {labels["result-label"]}
                </label>
                <textarea
                  ref={resultField}
                  id={`${id}-result`}
                  name="result"
                  className={`${kit.field} min-h-28 resize-y py-3`}
                  value={result}
                  onChange={(event) => {
                    setResult(event.target.value);
                    setErrors((current) => ({ ...current, result: undefined }));
                  }}
                  placeholder={labels["result-placeholder"]}
                  required
                  aria-invalid={Boolean(errors.result)}
                  aria-describedby={
                    errors.result ? `${id}-result-error` : undefined
                  }
                />
                {errors.result && (
                  <p
                    id={`${id}-result-error`}
                    className="text-sm text-sps-danger"
                    role="alert"
                  >
                    {errors.result}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-fit">
                <Icon name="paper-plane-tilt" />
                {labels.submit}
              </Button>
            </form>
          )}
        </PageSection>

        <aside className="min-w-0 rounded-2xl bg-sps-graphite p-6 text-white @3xl:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sps-green">
            <Icon name="clock" size={24} />
          </div>
          <h2 className="text-2xl font-semibold leading-tight">
            {sections.response.title}
          </h2>
          <div className="mt-4 text-sm leading-6 text-white/80 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_p]:text-white/80">
            <SectionText section={sections.response} tone="dark" />
          </div>
        </aside>
      </div>
    </ServicePage>
  );
}
