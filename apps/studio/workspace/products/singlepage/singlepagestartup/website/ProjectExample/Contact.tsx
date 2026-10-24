import { useState, type FormEvent } from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";
import type { IExampleProps } from "./interface";
import { Action, AppHeader, CourseArt, Screen, ui } from "./primitives";

export function Contact({ labels: l }: IExampleProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [format, setFormat] = useState("self");
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };
  return (
    <>
      <AppHeader title={l["demo-academy"]} icon="code" />
      <Screen screenKey={submitted ? "complete" : "form"}>
        <CourseArt title={l["demo-course-one"]} compact />
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#61717c]">
          {l["demo-course-meta"]}
        </p>
        <h3 className="sr-only">{l["demo-contact-title"]}</h3>
        <p className="text-xs leading-5 text-[#61717c]">
          {l["demo-contact-description"]}
        </p>
        {submitted ? (
          <div
            role="status"
            className="space-y-3 rounded-2xl border border-[#c7de9a] bg-[#edf6e1] p-4"
          >
            <Icon name="check-circle" size={24} />
            <h4 className="text-base font-semibold">
              {l["demo-contact-success"]}
            </h4>
            <p className="break-words text-xs leading-5">
              {name} · {email}
            </p>
            <p className="text-xs leading-5">
              {l["demo-format"]}: {l[`demo-format-${format}`]}
            </p>
            <p className="text-xs leading-5 text-[#61717c]">
              {l["demo-local-note"]}
            </p>
            <Action tone="secondary" onClick={() => setSubmitted(false)}>
              {l["demo-edit"]}
            </Action>
          </div>
        ) : (
          <form onSubmit={submit} className={`${ui.card} space-y-4`}>
            <h4 className="text-sm font-semibold">{l["demo-contact-form"]}</h4>
            <label className="block space-y-2 text-xs font-medium">
              <span>{l["demo-name-label"]}</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                className={ui.input}
                placeholder={l["demo-name-placeholder"]}
              />
            </label>
            <label className="block space-y-2 text-xs font-medium">
              <span>{l["demo-email-label"]}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className={ui.input}
                placeholder={l["demo-email-placeholder"]}
              />
            </label>
            <div className="space-y-2 text-xs font-medium">
              <label htmlFor="sps-demo-study-format" className="block">
                {l["demo-format"]}
              </label>
              <select
                id="sps-demo-study-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={ui.input}
              >
                <option value="self">{l["demo-format-self"]}</option>
                <option value="mentor">{l["demo-format-mentor"]}</option>
              </select>
            </div>
            <Action type="submit" className="w-full">
              {l["demo-contact-submit"]}
              <Icon name="arrow-right" size={20} />
            </Action>
            <p className="text-[10px] leading-4 text-[#61717c]">
              {l["demo-local-note"]}
            </p>
          </form>
        )}
        <details className={ui.card}>
          <summary
            className={`cursor-pointer text-xs font-semibold ${ui.focus}`}
          >
            {l["demo-program"]}
          </summary>
          <ol className="mt-3 space-y-3 text-xs leading-5 text-[#61717c]">
            {["idea", "build", "launch"].map((key, index) => (
              <li key={key}>
                <span className="mr-2 font-semibold text-[#18232a]">
                  0{index + 1}
                </span>
                {l[`demo-program-${key}`]}
              </li>
            ))}
          </ol>
        </details>
      </Screen>
    </>
  );
}
