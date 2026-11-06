import { useState, type FormEvent } from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";
import type { IExampleProps } from "./interface";
import { Action, AppHeader, Screen, Select, ui } from "./primitives";
import { webinarArtwork } from "./content";

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
      <AppHeader title={l["demo-academy"]} brand="start" />
      <Screen screenKey={submitted ? "complete" : "form"}>
        <div className="overflow-hidden rounded-2xl bg-[#30214d] text-white">
          <img
            src={webinarArtwork.launch.src}
            data-asset-id={webinarArtwork.launch.id}
            alt=""
            className="aspect-square w-full object-contain"
          />
          <div className="p-4">
            <p className="text-[9px] font-medium uppercase tracking-wider text-[#cebef2]">
              {l["demo-course-meta"]}
            </p>
            <h3 className="mt-3 text-xl font-semibold leading-tight">
              {l["demo-contact-title"]}
            </h3>
          </div>
        </div>
        <p className="text-xs leading-5 text-[#61717c]">
          {l["demo-contact-description"]}
        </p>
        <section
          aria-label={l["demo-webinar-topics"]}
          className="@container/topics space-y-2"
        >
          <h4 className="mb-3 text-sm font-semibold">
            {l["demo-webinar-topics"]}
          </h4>
          {["idea", "build", "launch"].map((key, index) => (
            <article
              key={key}
              className="flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-[#e5def3] bg-white p-3 @[240px]/topics:flex-row"
            >
              <img
                src={webinarArtwork[key].src}
                data-asset-id={webinarArtwork[key].id}
                alt=""
                loading="lazy"
                className="aspect-square w-16 shrink-0 rounded-xl object-contain"
              />
              <div className="min-w-0">
                <p className="text-[9px] font-semibold text-[#8467b0]">
                  0{index + 1}
                </p>
                <h5 className="mt-1 text-xs font-semibold leading-4">
                  {l[`demo-topic-${key}-title`]}
                </h5>
                <p className="mt-1 text-[10px] leading-4 text-[#61717c]">
                  {l[`demo-topic-${key}-text`]}
                </p>
              </div>
            </article>
          ))}
        </section>
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
              <Select
                id="sps-demo-study-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="self">{l["demo-format-self"]}</option>
                <option value="mentor">{l["demo-format-mentor"]}</option>
              </Select>
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
        <section
          aria-label={l["demo-mentor-heading"]}
          className="overflow-hidden rounded-2xl border border-[#e5def3] bg-white"
        >
          <img
            src={webinarArtwork.mentor.src}
            data-asset-id={webinarArtwork.mentor.id}
            alt={l["demo-mentor-alt"]}
            loading="lazy"
            className="aspect-square w-full object-contain"
          />
          <div className="space-y-2 p-4">
            <p className="text-[9px] font-medium uppercase tracking-wider text-[#8467b0]">
              {l["demo-mentor-heading"]}
            </p>
            <h4 className="text-base font-semibold">{l["demo-mentor-name"]}</h4>
            <p className="text-xs font-medium text-[#5a3f83]">
              {l["demo-mentor-role"]}
            </p>
            <p className="text-xs leading-5 text-[#61717c]">
              {l["demo-mentor-description"]}
            </p>
            <p className="text-[9px] leading-4 text-[#61717c]">
              {l["demo-mentor-note"]}
            </p>
          </div>
        </section>
      </Screen>
    </>
  );
}
